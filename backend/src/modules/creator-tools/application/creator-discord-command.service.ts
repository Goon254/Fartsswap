import type { Report } from '../../../shared/domain/models';
import { randomBytes } from 'crypto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { RegisterChallengeUseCase } from '../../challenges/application/register-challenge.use-case';
import { MethaneIndexQueryService } from '../../rituals/application/methane-index.query.service';
import { WrappedQueryService } from '../../rituals/application/wrapped.query.service';
import type { WrappedEnvelopeDto } from '../../rituals/interface/http/dto/wrapped.dto';
import { GenerateFakeReportUseCase } from '../../reports/application/generate-fake-report.use-case';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { CreateShareLinkUseCase } from '../../shares/application/create-share-link.use-case';
import { EntitlementResolutionService } from '../../plans/application/entitlement-resolution.service';
import { variantKeyFromReport } from '../../rituals/domain/variant-key';
import { BUREAU_BADGE_TEMPLATES } from '../domain/badge-templates';
import type { DiscordTransportPort } from '../domain/discord-transport.port';
import { MockDiscordTransportAdapter } from '../infrastructure/mock-discord-transport.adapter';
import type { DiscordBadgeBodyDto, DiscordChallengeBodyDto, DiscordClassifyBodyDto, DiscordShareBodyDto, DiscordWrappedBodyDto } from '../interface/http/dto/discord-command.dto';

const CHALLENGE_ID_RE = /^ch_[a-zA-Z0-9_-]{1,58}$/;

@Injectable()
export class CreatorDiscordCommandService {
  constructor(
    private readonly config: AppConfigService,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly generateFake: GenerateFakeReportUseCase,
    private readonly registerChallenge: RegisterChallengeUseCase,
    private readonly createShare: CreateShareLinkUseCase,
    private readonly methane: MethaneIndexQueryService,
    private readonly wrappedQuery: WrappedQueryService,
    private readonly track: TrackAnalyticsEventUseCase,
    private readonly discordTransport: MockDiscordTransportAdapter,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    private readonly entitlements: EntitlementResolutionService,
  ) {}

  private transport(): DiscordTransportPort {
    return this.discordTransport;
  }

  private assertCommand(command: string): void {
    const enabled = this.config.creatorCommunity.enabledCommands;
    if (!enabled.includes(command)) {
      throw new BadRequestException(`Command "${command}" is disabled for this deployment`);
    }
  }

  private baseCtx(ctx: { guildId?: string; channelId?: string; invokerLabel?: string }): Record<string, unknown> {
    return {
      transport: 'discord_mock',
      adapter: this.transport().name,
      communityLabel: this.config.creatorCommunity.label,
      bulletinStyle: this.config.creatorCommunity.bulletinStyle,
      tonePack: this.config.creatorCommunity.tonePack,
      ...(ctx.guildId ? { guildId: ctx.guildId } : {}),
      ...(ctx.channelId ? { channelId: ctx.channelId } : {}),
      ...(ctx.invokerLabel ? { invokerLabel: ctx.invokerLabel } : {}),
    };
  }

  private async auditDiscordInvoke(command: string, ctx: Record<string, unknown>): Promise<void> {
    await this.track.trackBestEffort({
      eventType: 'discord_command_invoked',
      payload: { command, ...ctx },
      ingestSource: 'server',
    });
  }

  private absUrl(path: string): string {
    const origin = this.config.publicWebOrigin;
    if (!origin) return path;
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async classify(body: DiscordClassifyBodyDto): Promise<Record<string, unknown>> {
    this.assertCommand('classify');
    const ctx = this.baseCtx(body);
    await this.auditDiscordInvoke('classify', ctx);
    await this.track.trackBestEffort({
      eventType: 'creator_tool_used',
      payload: { tool: 'classify', ...ctx },
      ingestSource: 'server',
    });

    const batchSize = body.batchSize ?? 1;
    const enforcement = this.config.creatorPlans.entitlementEnforcement;
    if (batchSize > 1 && enforcement) {
      if (!body.holderSessionId?.trim()) {
        throw new BadRequestException(
          'holderSessionId is required when batchSize > 1 while CREATOR_ENTITLEMENT_ENFORCEMENT=true',
        );
      }
      await this.entitlements.assertCanConsume({
        sessionId: body.holderSessionId.trim(),
        featureKey: 'batch_generation',
        units: batchSize,
      });
    }

    const reports: Report[] = [];
    for (let i = 0; i < batchSize; i++) {
      const report = await this.generateFake.execute({
        sessionId: body.holderSessionId?.trim() || undefined,
        customFartName: body.customFartName,
        tonePreset: body.tonePreset ?? this.config.creatorCommunity.tonePack,
        ipAddress: undefined,
      });
      reports.push(report);
      await this.track.trackBestEffort({
        eventType: 'community_artifact_issued',
        reportId: report.id,
        payload: {
          kind: 'report',
          publicSlug: report.publicSlug,
          classification: report.classification,
          variantId: report.variantId,
          batchIndex: i,
          batchSize,
          ...ctx,
        },
        ingestSource: 'server',
      });
    }

    if (batchSize > 1 && enforcement && body.holderSessionId?.trim()) {
      await this.entitlements.consume({
        sessionId: body.holderSessionId.trim(),
        featureKey: 'batch_generation',
        units: batchSize,
        surface: 'discord_classify',
      });
    }

    const report = reports[reports.length - 1]!;
    const notice =
      batchSize === 1
        ? `CLASSIFICATION ISSUED · ${report.classification} · Power ${report.powerScore}/100 · Threat ${report.threatLevel}. Dossier filed under bureau community tooling.`
        : `BATCH CLASSIFICATION · ${batchSize} dossiers minted. Latest: ${report.classification} · Power ${report.powerScore}/100.`;
    await this.transport().deliverEphemeralNotice(notice);

    return {
      ok: true,
      command: 'classify',
      community: this.config.creatorCommunity.label,
      noticeText: notice,
      batchSize,
      reports: reports.map((r) => ({
        id: r.id,
        publicSlug: r.publicSlug,
        classification: r.classification,
        variantId: r.variantId,
        powerScore: r.powerScore,
        threatLevel: r.threatLevel,
        fartHash: r.fartHash,
      })),
      links: {
        dossier: this.absUrl(`/report?variant=${encodeURIComponent(report.variantId ?? report.classification)}`),
        wrappedHint: this.absUrl('/fart-wrapped'),
      },
    };
  }

  async challenge(body: DiscordChallengeBodyDto): Promise<Record<string, unknown>> {
    this.assertCommand('challenge');
    const ctx = this.baseCtx(body);
    await this.auditDiscordInvoke('challenge', ctx);
    await this.track.trackBestEffort({
      eventType: 'creator_tool_used',
      payload: { tool: 'challenge', ...ctx },
      ingestSource: 'server',
    });

    let challengeId = body.challengeId?.trim();
    if (!challengeId) {
      const suffix = randomBytes(12).toString('base64url').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
      challengeId = `ch_${suffix}`;
    }
    if (!CHALLENGE_ID_RE.test(challengeId)) {
      throw new BadRequestException('challengeId must match ch_[a-zA-Z0-9_-]{1,58}');
    }

    const score = body.sourceScore ?? 72;
    const link = await this.registerChallenge.execute({
      id: challengeId,
      sessionId: body.sessionId,
      reportId: body.reportId,
      variantId: body.variantId,
      sourceScore: Math.min(100, Math.max(0, Math.round(score))),
      challengeType: body.challengeType ?? 'community_dispute',
      sourceSurface: body.sourceSurface ?? 'discord',
      issuedAt: this.clock.now().toISOString(),
      metadata: { ...ctx, communityTooling: true },
    });

    await this.track.trackBestEffort({
      eventType: 'community_artifact_issued',
      ...(body.reportId ? { reportId: body.reportId } : {}),
      payload: {
        kind: 'challenge',
        challengeId: link.id,
        variantId: link.variantId,
        ...ctx,
      },
      ingestSource: 'server',
    });

    const notice = `CHALLENGE REGISTERED · ${link.id} · Variant ${link.variantId}. Forward for jurisdictional review.`;
    await this.transport().deliverEphemeralNotice(notice);

    return {
      ok: true,
      command: 'challenge',
      community: this.config.creatorCommunity.label,
      noticeText: notice,
      challenge: link,
      links: {
        api: this.absUrl(`/api/v1/challenges/${encodeURIComponent(link.id)}`),
      },
    };
  }

  async badge(body: DiscordBadgeBodyDto): Promise<Record<string, unknown>> {
    this.assertCommand('badge');
    const ctx = this.baseCtx(body);
    await this.auditDiscordInvoke('badge', { ...ctx, templateId: body.templateId });
    await this.track.trackBestEffort({
      eventType: 'creator_tool_used',
      payload: { tool: 'badge', templateId: body.templateId, ...ctx },
      ingestSource: 'server',
    });

    const tpl = BUREAU_BADGE_TEMPLATES[body.templateId];
    if (!tpl) {
      throw new BadRequestException(`Unknown badge template: ${body.templateId}`);
    }

    const honoree = body.honoreeLine?.trim() ?? 'An unnamed correspondent';
    const notice = `DISTINCTION ISSUED · ${tpl.title} · ${honoree}. ${tpl.body}`;

    await this.track.trackBestEffort({
      eventType: 'badge_issued',
      payload: {
        templateId: tpl.id,
        honoreeLine: honoree,
        variantId: body.variantId,
        ...ctx,
      },
      ingestSource: 'server',
    });
    await this.track.trackBestEffort({
      eventType: 'community_artifact_issued',
      payload: { kind: 'badge', templateId: tpl.id, ...ctx },
      ingestSource: 'server',
    });

    await this.transport().deliverEphemeralNotice(notice);

    return {
      ok: true,
      command: 'badge',
      community: this.config.creatorCommunity.label,
      noticeText: notice,
      badge: {
        ...tpl,
        honoreeLine: honoree,
        variantId: body.variantId,
      },
    };
  }

  async methaneIndex(query: { guildId?: string; channelId?: string; invokerLabel?: string }): Promise<Record<string, unknown>> {
    this.assertCommand('methane-index');
    const ctx = this.baseCtx(query);
    await this.auditDiscordInvoke('methane-index', ctx);
    await this.track.trackBestEffort({
      eventType: 'creator_tool_used',
      payload: { tool: 'methane-index', ...ctx },
      ingestSource: 'server',
    });

    const envelope = await this.methane.getCurrent();
    await this.track.trackBestEffort({
      eventType: 'ritual_bulletin_posted',
      payload: {
        ritual: 'methane_index',
        provenance: envelope.provenance,
        issueId: envelope.issue?.issueId,
        ...ctx,
      },
      ingestSource: 'server',
    });

    const headline = envelope.issue?.title ?? 'National Methane Index';
    const notice = `BULLETIN PULLED · ${headline} · Window ${envelope.window.label}. Distribution authorised for community channels.`;
    await this.transport().deliverEphemeralNotice(notice);

    return {
      ok: true,
      command: 'methane-index',
      community: this.config.creatorCommunity.label,
      noticeText: notice,
      envelope,
      links: {
        publicBulletin: this.absUrl('/methane-index'),
      },
    };
  }

  async compileWrapped(body: DiscordWrappedBodyDto): Promise<Record<string, unknown>> {
    this.assertCommand('wrapped');
    const ctx = this.baseCtx(body);
    await this.auditDiscordInvoke('wrapped', ctx);
    await this.track.trackBestEffort({
      eventType: 'creator_tool_used',
      payload: { tool: 'wrapped', ...ctx },
      ingestSource: 'server',
    });

    const sessionId = body.sessionId?.trim();
    let envelope: WrappedEnvelopeDto;
    if (body.slug) {
      envelope = await this.wrappedQuery.getForSlug(body.slug);
    } else {
      if (!sessionId) {
        throw new BadRequestException('Provide sessionId or slug');
      }
      envelope = await this.wrappedQuery.getCurrentForSession(sessionId);
    }

    await this.track.trackBestEffort({
      eventType: 'ritual_bulletin_posted',
      payload: {
        ritual: 'fart_wrapped',
        provenance: envelope.provenance,
        wrappedCycleId: envelope.issue?.wrappedCycleId,
        ...ctx,
      },
      ingestSource: 'server',
    });

    const notice = `WRAPPED PAYLOAD COMPILED · ${envelope.issue?.wrappedCycleId ?? 'PROVISIONAL'} · Cohort ${envelope.cohortYear}.`;
    await this.transport().deliverEphemeralNotice(notice);

    return {
      ok: true,
      command: 'wrapped',
      community: this.config.creatorCommunity.label,
      noticeText: notice,
      envelope,
      links: {
        publicWrapped: this.absUrl(body.slug ? `/fart-wrapped?slug=${encodeURIComponent(body.slug)}` : '/fart-wrapped'),
      },
    };
  }

  async share(body: DiscordShareBodyDto): Promise<Record<string, unknown>> {
    this.assertCommand('share');
    const ctx = this.baseCtx(body);
    await this.auditDiscordInvoke('share', ctx);
    await this.track.trackBestEffort({
      eventType: 'creator_tool_used',
      payload: { tool: 'share', reportId: body.reportId, ...ctx },
      ingestSource: 'server',
    });

    const link = await this.createShare.execute({
      reportId: body.reportId,
      sessionId: body.sessionId,
      kind: 'discord_tooling',
      metadata: { ...ctx, communityTooling: true },
    });

    await this.track.trackBestEffort({
      eventType: 'community_artifact_issued',
      reportId: body.reportId,
      payload: {
        kind: 'share_link',
        shareLinkId: link.id,
        ...ctx,
      },
      ingestSource: 'server',
    });

    const notice = `SHARE OBJECT MINTED · Report ${body.reportId} · Token issued for community distribution.`;
    await this.transport().deliverEphemeralNotice(notice);

    const reportRow = await this.reports.findReportById(body.reportId);
    const variantForShare = reportRow
      ? variantKeyFromReport(reportRow.classification, reportRow.variantId)
      : 'unknown';

    return {
      ok: true,
      command: 'share',
      community: this.config.creatorCommunity.label,
      noticeText: notice,
      share: link,
      links: {
        shareCard: this.absUrl(`/share?variant=${encodeURIComponent(variantForShare)}`),
      },
    };
  }
}
