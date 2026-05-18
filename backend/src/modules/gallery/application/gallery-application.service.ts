import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { AppConfigService } from '../../../config/config.service';
import {
  AnalyticsEventType,
  ArtifactStatus,
  ReportStatus,
} from '../../../shared/domain/types';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { ReportArtifactEntity } from '../../artifacts/infrastructure/persistence/report-artifact.entity';
import type { GallerySubmissionStatus } from '../domain/gallery-lifecycle';
import { canSubmitFromStatus } from '../domain/gallery-lifecycle';
import {
  isGalleryOperatorReasonCode,
  isGalleryUserReportReason,
  runGalleryAutomatedScreeningStub,
} from '../domain/moderation-policy';
import { GallerySubmissionEntity } from '../infrastructure/persistence/gallery-submission.entity';
import { GalleryDecisionLogEntity } from '../infrastructure/persistence/gallery-decision-log.entity';
import { GalleryItemReportEntity } from '../infrastructure/persistence/gallery-item-report.entity';
import { GallerySessionBlockEntity } from '../infrastructure/persistence/gallery-session-block.entity';

export interface GallerySubmissionRow {
  id: string;
  reportId: string;
  reportArtifactId?: string;
  submitterSessionId: string;
  status: GallerySubmissionStatus;
  listed: boolean;
  featuredRank?: number;
  submittedAt: string;
  publishedAt?: string;
  removedAt?: string;
  lastReasonCode?: string;
  operatorNotes?: string;
}

export interface GalleryPublicFeedItem {
  submissionId: string;
  reportId: string;
  publicSlug?: string;
  variantId?: string;
  classification: string;
  powerScore: number;
  threatLevel: string;
  artifactType?: string;
  themeCode?: string;
  featuredRank?: number;
  publishedAt: string;
}

export interface GalleryOpsSubmissionDetail extends GallerySubmissionRow {
  report: {
    fartName: string;
    classification: string;
    powerScore: number;
    publicSlug?: string;
    variantId?: string;
    status: string;
  };
  openReportCount: number;
}

export type GalleryModerateAction =
  | 'approve'
  | 'reject'
  | 'publish'
  | 'remove'
  | 'feature'
  | 'unfeature'
  | 'hide'
  | 'unhide'
  | 'clear_reports';

@Injectable()
export class GalleryApplicationService {
  constructor(
    @InjectRepository(GallerySubmissionEntity)
    private readonly submissions: Repository<GallerySubmissionEntity>,
    @InjectRepository(GalleryDecisionLogEntity)
    private readonly decisions: Repository<GalleryDecisionLogEntity>,
    @InjectRepository(GalleryItemReportEntity)
    private readonly itemReports: Repository<GalleryItemReportEntity>,
    @InjectRepository(GallerySessionBlockEntity)
    private readonly blocks: Repository<GallerySessionBlockEntity>,
    @InjectRepository(ReportArtifactEntity)
    private readonly artifacts: Repository<ReportArtifactEntity>,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly track: TrackAnalyticsEventUseCase,
    private readonly config: AppConfigService,
  ) {}

  private now(): Date {
    return this.clock.now();
  }

  private toRow(e: GallerySubmissionEntity): GallerySubmissionRow {
    return {
      id: e.id,
      reportId: e.reportId,
      reportArtifactId: e.reportArtifactId,
      submitterSessionId: e.submitterSessionId,
      status: e.status as GallerySubmissionStatus,
      listed: e.listed,
      featuredRank: e.featuredRank ?? undefined,
      submittedAt: e.submittedAt.toISOString(),
      publishedAt: e.publishedAt?.toISOString(),
      removedAt: e.removedAt?.toISOString(),
      lastReasonCode: e.lastReasonCode ?? undefined,
      operatorNotes: e.operatorNotes ?? undefined,
    };
  }

  private async assertActiveBlock(sessionId: string, kind: 'gallery_submit' | 'gallery_report'): Promise<void> {
    const rows = await this.blocks
      .createQueryBuilder('b')
      .where('b.session_id = :sessionId', { sessionId })
      .andWhere('b.restriction_kind = :kind', { kind })
      .andWhere('b.revoked_at IS NULL')
      .andWhere('(b.expires_at IS NULL OR b.expires_at > :now)', { now: this.now() })
      .getMany();
    if (rows.length > 0) {
      throw new ForbiddenException('gallery restriction in effect for this session');
    }
  }

  private async appendDecisionLog(args: {
    submissionId: string;
    action: string;
    actorKind: 'system' | 'operator' | 'user';
    actorRef?: string;
    fromStatus?: string;
    toStatus?: string;
    reasonCode?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const row = this.decisions.create({
      id: this.ids.generate(),
      submissionId: args.submissionId,
      action: args.action,
      actorKind: args.actorKind,
      actorRef: args.actorRef,
      fromStatus: args.fromStatus,
      toStatus: args.toStatus,
      reasonCode: args.reasonCode,
      notes: args.notes,
      metadata: args.metadata,
      createdAt: this.now(),
    });
    await this.decisions.save(row);
  }

  async submitForReview(args: {
    sessionId: string;
    reportId: string;
    reportArtifactId?: string;
  }): Promise<GallerySubmissionRow> {
    if (!this.config.gallery.submissionsEnabled) {
      throw new ForbiddenException('gallery submissions are disabled');
    }
    await this.assertActiveBlock(args.sessionId, 'gallery_submit');

    const report = await this.reports.findReportById(args.reportId);
    if (!report) throw new NotFoundException('report not found');
    if (report.sessionId !== args.sessionId) {
      throw new ForbiddenException('report does not belong to this session');
    }
    if (report.status !== ReportStatus.COMPLETED) {
      throw new BadRequestException('only completed reports may enter gallery review');
    }

    if (args.reportArtifactId) {
      const art = await this.artifacts.findOne({ where: { id: args.reportArtifactId } });
      if (!art) throw new NotFoundException('artifact not found');
      if (art.reportId !== args.reportId) {
        throw new BadRequestException('artifact does not belong to this report');
      }
      if (art.status !== ArtifactStatus.READY) {
        throw new BadRequestException('artifact must be ready to attach to a gallery submission');
      }
    }

    const screening = runGalleryAutomatedScreeningStub();
    const existing = await this.submissions.findOne({ where: { reportId: args.reportId } });
    const t = this.now();

    if (existing) {
      if (!canSubmitFromStatus(existing.status as GallerySubmissionStatus)) {
        throw new ConflictException('this report already has an active gallery submission');
      }
      const from = existing.status;
      existing.status = 'submitted_for_review';
      existing.submitterSessionId = args.sessionId;
      existing.reportArtifactId = args.reportArtifactId;
      existing.submittedAt = t;
      existing.updatedAt = t;
      existing.listed = true;
      existing.featuredRank = undefined;
      existing.publishedAt = undefined;
      existing.removedAt = undefined;
      existing.lastReasonCode = undefined;
      existing.automatedScreening = screening as unknown as Record<string, unknown>;
      await this.submissions.save(existing);
      await this.appendDecisionLog({
        submissionId: existing.id,
        action: 'resubmit',
        actorKind: 'user',
        actorRef: args.sessionId,
        fromStatus: from,
        toStatus: 'submitted_for_review',
        metadata: { screening },
      });
      await this.track.trackBestEffort({
        sessionId: args.sessionId,
        reportId: args.reportId,
        eventType: AnalyticsEventType.GALLERY_SUBMISSION_CREATED,
        payload: { submissionId: existing.id, resubmission: true, screeningPipeline: screening.pipelineVersion },
      });
      return this.toRow(existing);
    }

    const row = this.submissions.create({
      id: this.ids.generate(),
      reportId: args.reportId,
      reportArtifactId: args.reportArtifactId,
      submitterSessionId: args.sessionId,
      status: 'submitted_for_review',
      listed: true,
      automatedScreening: screening as unknown as Record<string, unknown>,
      submittedAt: t,
      createdAt: t,
      updatedAt: t,
    });
    await this.submissions.save(row);
    await this.appendDecisionLog({
      submissionId: row.id,
      action: 'submit',
      actorKind: 'user',
      actorRef: args.sessionId,
      toStatus: 'submitted_for_review',
      metadata: { screening },
    });
    await this.track.trackBestEffort({
      sessionId: args.sessionId,
      reportId: args.reportId,
      eventType: AnalyticsEventType.GALLERY_SUBMISSION_CREATED,
      payload: { submissionId: row.id, screeningPipeline: screening.pipelineVersion },
    });
    return this.toRow(row);
  }

  async getSubmissionForReportAndSession(
    sessionId: string,
    reportId: string,
  ): Promise<GallerySubmissionRow | null> {
    const report = await this.reports.findReportById(reportId);
    if (!report) throw new NotFoundException('report not found');
    if (report.sessionId !== sessionId) {
      throw new ForbiddenException('report does not belong to this session');
    }
    const row = await this.submissions.findOne({ where: { reportId } });
    return row ? this.toRow(row) : null;
  }

  async fileReport(args: {
    reporterSessionId: string;
    submissionId: string;
    reasonCode: string;
    details?: string;
  }): Promise<{ ok: true }> {
    await this.assertActiveBlock(args.reporterSessionId, 'gallery_report');
    if (!isGalleryUserReportReason(args.reasonCode)) {
      throw new BadRequestException('invalid report reason code');
    }
    const sub = await this.submissions.findOne({ where: { id: args.submissionId } });
    if (!sub) throw new NotFoundException('submission not found');
    if (sub.status !== 'published' && sub.status !== 'reported') {
      throw new BadRequestException('only published gallery items may be reported');
    }

    try {
      const rep = this.itemReports.create({
        id: this.ids.generate(),
        submissionId: sub.id,
        reporterSessionId: args.reporterSessionId,
        reasonCode: args.reasonCode,
        details: args.details,
        createdAt: this.now(),
      });
      await this.itemReports.save(rep);
    } catch (e: unknown) {
      if (
        e instanceof QueryFailedError &&
        typeof e.driverError === 'object' &&
        e.driverError !== null &&
        'code' in e.driverError &&
        (e.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('you have already filed a report for this item');
      }
      throw e;
    }

    const from = sub.status;
    if (sub.status === 'published') {
      sub.status = 'reported';
      sub.updatedAt = this.now();
      await this.submissions.save(sub);
    }

    await this.appendDecisionLog({
      submissionId: sub.id,
      action: 'user_report_filed',
      actorKind: 'user',
      actorRef: args.reporterSessionId,
      fromStatus: from,
      toStatus: sub.status,
      reasonCode: args.reasonCode,
      notes: args.details,
    });

    await this.track.trackBestEffort({
      sessionId: args.reporterSessionId,
      reportId: sub.reportId,
      eventType: AnalyticsEventType.GALLERY_REPORT_FILED,
      payload: { submissionId: sub.id, reasonCode: args.reasonCode },
    });
    return { ok: true };
  }

  async listPublicFeed(limit: number): Promise<{ enabled: boolean; items: GalleryPublicFeedItem[] }> {
    if (!this.config.gallery.publicFeedEnabled) {
      return { enabled: false, items: [] };
    }
    const cap = Math.min(Math.max(limit, 1), 100);
    const rows = await this.submissions
      .createQueryBuilder('s')
      .innerJoin('reports', 'r', 'r.id = s.report_id')
      .where('s.status IN (:...st)', { st: ['published', 'reported'] })
      .andWhere('s.listed = true')
      .orderBy('s.featured_rank', 'ASC', 'NULLS LAST')
      .addOrderBy('s.published_at', 'DESC')
      .select([
        's.id AS submission_id',
        's.report_id AS report_id',
        'r.public_slug AS public_slug',
        'r.variant_id AS variant_id',
        'r.classification AS classification',
        'r.power_score AS power_score',
        'r.threat_level AS threat_level',
        's.featured_rank AS featured_rank',
        's.published_at AS published_at',
        's.report_artifact_id AS report_artifact_id',
      ])
      .take(cap)
      .getRawMany<{
        submission_id: string;
        report_id: string;
        public_slug: string | null;
        variant_id: string | null;
        classification: string;
        power_score: string;
        threat_level: string;
        featured_rank: string | null;
        published_at: Date;
        report_artifact_id: string | null;
      }>();

    const items: GalleryPublicFeedItem[] = [];
    for (const raw of rows) {
      let artifactType: string | undefined;
      let themeCode: string | undefined;
      if (raw.report_artifact_id) {
        const art = await this.artifacts.findOne({
          where: { id: raw.report_artifact_id },
          select: ['type', 'themeCode'],
        });
        artifactType = art?.type;
        themeCode = art?.themeCode ?? undefined;
      }
      items.push({
        submissionId: raw.submission_id,
        reportId: raw.report_id,
        publicSlug: raw.public_slug ?? undefined,
        variantId: raw.variant_id ?? undefined,
        classification: raw.classification,
        powerScore: Number(raw.power_score),
        threatLevel: raw.threat_level,
        artifactType,
        themeCode,
        featuredRank: raw.featured_rank != null ? Number(raw.featured_rank) : undefined,
        publishedAt: raw.published_at.toISOString(),
      });
    }
    return { enabled: true, items };
  }

  async listQueue(status?: GallerySubmissionStatus, limit = 50): Promise<GalleryOpsSubmissionDetail[]> {
    const cap = Math.min(Math.max(limit, 1), 200);
    const st = status ?? 'submitted_for_review';
    const subs = await this.submissions.find({
      where: { status: st },
      order: { submittedAt: 'ASC' },
      take: cap,
    });
    const out: GalleryOpsSubmissionDetail[] = [];
    for (const s of subs) {
      const detail = await this.buildOpsDetail(s);
      out.push(detail);
    }
    return out;
  }

  async getOpsSubmission(id: string): Promise<GalleryOpsSubmissionDetail> {
    const s = await this.submissions.findOne({ where: { id } });
    if (!s) throw new NotFoundException('submission not found');
    return this.buildOpsDetail(s);
  }

  private async buildOpsDetail(s: GallerySubmissionEntity): Promise<GalleryOpsSubmissionDetail> {
    const report = await this.reports.findReportById(s.reportId);
    if (!report) throw new NotFoundException('report missing for submission');
    const openReportCount = await this.itemReports.count({
      where: { submissionId: s.id, resolvedAt: IsNull() },
    });
    return {
      ...this.toRow(s),
      report: {
        fartName: report.fartName,
        classification: report.classification,
        powerScore: report.powerScore,
        publicSlug: report.publicSlug,
        variantId: report.variantId,
        status: report.status,
      },
      openReportCount,
    };
  }

  async moderate(args: {
    submissionId: string;
    action: GalleryModerateAction;
    operatorRef?: string;
    reasonCode?: string;
    notes?: string;
    featuredRank?: number | null;
  }): Promise<GallerySubmissionRow> {
    const sub = await this.submissions.findOne({ where: { id: args.submissionId } });
    if (!sub) throw new NotFoundException('submission not found');

    if (args.reasonCode && !isGalleryOperatorReasonCode(args.reasonCode)) {
      throw new BadRequestException('invalid operator reason code');
    }

    const from = sub.status;
    const t = this.now();

    switch (args.action) {
      case 'approve': {
        if (sub.status !== 'submitted_for_review') {
          throw new BadRequestException('approve only from submitted_for_review');
        }
        sub.status = 'approved';
        sub.operatorNotes = args.notes ?? sub.operatorNotes;
        sub.lastReasonCode = args.reasonCode ?? sub.lastReasonCode;
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'approve',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: 'approved',
          reasonCode: args.reasonCode,
          notes: args.notes,
        });
        await this.track.trackBestEffort({
          reportId: sub.reportId,
          eventType: AnalyticsEventType.GALLERY_SUBMISSION_APPROVED,
          payload: { submissionId: sub.id },
        });
        break;
      }
      case 'reject': {
        if (sub.status !== 'submitted_for_review') {
          throw new BadRequestException('reject only from submitted_for_review');
        }
        sub.status = 'rejected';
        sub.operatorNotes = args.notes ?? sub.operatorNotes;
        sub.lastReasonCode = args.reasonCode ?? sub.lastReasonCode ?? 'operator_other';
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'reject',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: 'rejected',
          reasonCode: args.reasonCode,
          notes: args.notes,
        });
        await this.track.trackBestEffort({
          reportId: sub.reportId,
          eventType: AnalyticsEventType.GALLERY_SUBMISSION_REJECTED,
          payload: { submissionId: sub.id, reasonCode: sub.lastReasonCode },
        });
        break;
      }
      case 'publish': {
        if (sub.status !== 'approved') {
          throw new BadRequestException('publish only from approved');
        }
        sub.status = 'published';
        sub.publishedAt = t;
        sub.listed = true;
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'publish',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: 'published',
          notes: args.notes,
        });
        break;
      }
      case 'remove': {
        if (sub.status !== 'published' && sub.status !== 'reported') {
          throw new BadRequestException('remove only from published or reported');
        }
        sub.status = 'removed';
        sub.removedAt = t;
        sub.listed = false;
        sub.featuredRank = undefined;
        sub.operatorNotes = args.notes ?? sub.operatorNotes;
        sub.lastReasonCode = args.reasonCode ?? sub.lastReasonCode ?? 'operator_other';
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.itemReports
          .createQueryBuilder()
          .update(GalleryItemReportEntity)
          .set({ resolvedAt: t })
          .where('submission_id = :id', { id: sub.id })
          .andWhere('resolved_at IS NULL')
          .execute();
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'remove',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: 'removed',
          reasonCode: args.reasonCode,
          notes: args.notes,
        });
        await this.track.trackBestEffort({
          reportId: sub.reportId,
          eventType: AnalyticsEventType.GALLERY_ITEM_REMOVED,
          payload: { submissionId: sub.id, reasonCode: sub.lastReasonCode },
        });
        break;
      }
      case 'feature': {
        if (sub.status !== 'published' && sub.status !== 'reported') {
          throw new BadRequestException('feature only when live');
        }
        if (args.featuredRank === undefined || args.featuredRank === null) {
          throw new BadRequestException('featuredRank required for feature action');
        }
        sub.featuredRank = args.featuredRank;
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'feature',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: from,
          notes: args.notes,
          metadata: { featuredRank: sub.featuredRank },
        });
        await this.track.trackBestEffort({
          reportId: sub.reportId,
          eventType: AnalyticsEventType.GALLERY_ITEM_FEATURED,
          payload: { submissionId: sub.id, featuredRank: sub.featuredRank },
        });
        break;
      }
      case 'unfeature': {
        sub.featuredRank = undefined;
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'unfeature',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: from,
        });
        break;
      }
      case 'hide': {
        if (sub.status !== 'published' && sub.status !== 'reported') {
          throw new BadRequestException('hide only when live');
        }
        sub.listed = false;
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'hide',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: from,
          notes: args.notes,
        });
        break;
      }
      case 'unhide': {
        if (sub.status !== 'published' && sub.status !== 'reported') {
          throw new BadRequestException('unhide only when live');
        }
        sub.listed = true;
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'unhide',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: from,
        });
        break;
      }
      case 'clear_reports': {
        if (sub.status !== 'reported') {
          throw new BadRequestException('clear_reports only from reported');
        }
        await this.itemReports
          .createQueryBuilder()
          .update(GalleryItemReportEntity)
          .set({ resolvedAt: t })
          .where('submission_id = :id', { id: sub.id })
          .andWhere('resolved_at IS NULL')
          .execute();
        sub.status = 'published';
        sub.updatedAt = t;
        await this.submissions.save(sub);
        await this.appendDecisionLog({
          submissionId: sub.id,
          action: 'clear_reports',
          actorKind: 'operator',
          actorRef: args.operatorRef,
          fromStatus: from,
          toStatus: 'published',
          notes: args.notes,
        });
        break;
      }
      default:
        throw new BadRequestException('unknown action');
    }

    const refreshed = await this.submissions.findOne({ where: { id: sub.id } });
    if (!refreshed) throw new NotFoundException('submission not found after update');
    return this.toRow(refreshed);
  }

  async createSessionBlock(args: {
    sessionId: string;
    restrictionKind: 'gallery_submit' | 'gallery_report';
    reasonCode: string;
    notes?: string;
    createdBy?: string;
    expiresAt?: Date;
  }): Promise<{ id: string }> {
    if (!isGalleryOperatorReasonCode(args.reasonCode)) {
      throw new BadRequestException('invalid reason for enforcement block');
    }
    const row = this.blocks.create({
      id: this.ids.generate(),
      sessionId: args.sessionId,
      restrictionKind: args.restrictionKind,
      reasonCode: args.reasonCode,
      notes: args.notes,
      createdBy: args.createdBy,
      expiresAt: args.expiresAt,
      createdAt: this.now(),
    });
    await this.blocks.save(row);
    return { id: row.id };
  }

  async revokeSessionBlock(blockId: string): Promise<void> {
    const b = await this.blocks.findOne({ where: { id: blockId } });
    if (!b) throw new NotFoundException('block not found');
    b.revokedAt = this.now();
    await this.blocks.save(b);
  }

  async listSessionBlocks(sessionId: string): Promise<GallerySessionBlockEntity[]> {
    return this.blocks.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
    });
  }

  async listDecisionLog(submissionId: string): Promise<GalleryDecisionLogEntity[]> {
    return this.decisions.find({
      where: { submissionId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
