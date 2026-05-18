import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PremiumIntent } from '../../../shared/domain/models';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { GeneratePdfReportArtifactUseCase } from '../../artifacts/application/generate-pdf-report-artifact.use-case';
import { mapPremiumIntentEntityToDomain } from '../../commerce/infrastructure/persistence/premium-intent.mapper';
import { PremiumIntentEntity } from '../../commerce/infrastructure/persistence/premium-intent.entity';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { buildMerchReadyBundle } from '../domain/merch-ready-bundle';
import {
  canTransitionCommerceLifecycle,
  isPremiumCommerceLifecycleState,
  type PremiumCommerceLifecycleState,
} from '../domain/premium-commerce-lifecycle';
import { getPremiumArtifactTheme, listPremiumArtifactThemes } from '../domain/premium-artifact-catalog';
import { FulfillmentCheckoutHandoffService } from '../../fulfillment/application/fulfillment-checkout-handoff.service';

@Injectable()
export class ArtifactCommerceIntentService {
  constructor(
    @InjectRepository(PremiumIntentEntity) private readonly intents: Repository<PremiumIntentEntity>,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
    private readonly generatePdfReport: GeneratePdfReportArtifactUseCase,
    private readonly fulfillmentHandoff: FulfillmentCheckoutHandoffService,
  ) {}

  listPremiumThemes() {
    return listPremiumArtifactThemes().filter((t) => t.available);
  }

  getPremiumTheme(code: string) {
    const theme = getPremiumArtifactTheme(code);
    if (!theme || !theme.available) {
      throw new NotFoundException(`Unknown or unavailable theme ${code}`);
    }
    return theme;
  }

  async createCommerceIntent(args: {
    sessionId: string;
    reportId: string;
    sourceSurface?: string;
    variantId?: string;
  }): Promise<PremiumIntent> {
    const report = await this.requireOwnedReport(args.reportId, args.sessionId);
    const now = this.clock.now();
    const entity = new PremiumIntentEntity();
    entity.id = this.ids.generate();
    entity.sessionId = args.sessionId;
    entity.reportId = args.reportId;
    entity.kind = 'artifact_commerce';
    entity.payload = {
      sourceSurface: args.sourceSurface ?? 'unknown',
      ...(args.variantId !== undefined ? { variantId: args.variantId } : {}),
      classification: report.classification,
    };
    entity.lifecycleState = 'intent_created';
    entity.currency = 'USD';
    entity.createdAt = now;
    entity.updatedAt = now;
    const saved = await this.intents.save(entity);
    return mapPremiumIntentEntityToDomain(saved);
  }

  async getIntentForSession(intentId: string, sessionId: string): Promise<PremiumIntent> {
    const row = await this.requireIntentRow(intentId, sessionId);
    return mapPremiumIntentEntityToDomain(row);
  }

  async transitionIntent(args: {
    intentId: string;
    sessionId: string;
    targetState: string;
    commerceThemeCode?: string;
    productSku?: string;
    amountCents?: number;
  }): Promise<PremiumIntent> {
    const row = await this.requireIntentRow(args.intentId, args.sessionId);
    if (!isPremiumCommerceLifecycleState(args.targetState)) {
      throw new BadRequestException(`Invalid target state ${args.targetState}`);
    }
    const from = normalizeLifecycle(row.lifecycleState);
    const to = args.targetState;
    if (!canTransitionCommerceLifecycle(from, to)) {
      throw new BadRequestException(`Cannot transition from ${from} to ${to}`);
    }

    if (to === 'theme_selected') {
      if (!args.commerceThemeCode) {
        throw new BadRequestException('commerceThemeCode is required for theme_selected');
      }
      const theme = getPremiumArtifactTheme(args.commerceThemeCode);
      if (!theme?.available) {
        throw new BadRequestException(`Unknown or unavailable theme ${args.commerceThemeCode}`);
      }
      row.commerceThemeCode = theme.code;
      row.amountCents = args.amountCents ?? theme.priceCents;
      row.productSku = args.productSku ?? theme.productSkus.officialPdf;
      void this.trackEvent.trackBestEffort({
        sessionId: args.sessionId,
        reportId: row.reportId,
        eventType: AnalyticsEventType.PREMIUM_THEME_SELECTED,
        payload: {
          intentId: row.id,
          commerceThemeCode: theme.code,
          pdfThemeCode: theme.pdfThemeCode,
          productSku: row.productSku,
        },
      });
    }

    if (to === 'offer_presented') {
      void this.trackEvent.trackBestEffort({
        sessionId: args.sessionId,
        reportId: row.reportId,
        eventType: AnalyticsEventType.PREMIUM_OFFER_VIEWED,
        payload: { intentId: row.id, surface: (row.payload as { sourceSurface?: string })?.sourceSurface },
      });
    }

    row.lifecycleState = to;
    row.updatedAt = this.clock.now();
    const saved = await this.intents.save(row);
    return mapPremiumIntentEntityToDomain(saved);
  }

  async prepareCheckout(args: { intentId: string; sessionId: string }): Promise<{
    intent: PremiumIntent;
    checkoutSessionId: string;
    provider: 'stripe_placeholder';
    lineItems: readonly { sku: string; quantity: number; unitAmountCents: number; currency: string }[];
  }> {
    const row = await this.requireIntentRow(args.intentId, args.sessionId);
    if (row.lifecycleState !== 'theme_selected') {
      throw new BadRequestException('Checkout prep requires lifecycle theme_selected');
    }
    const theme = row.commerceThemeCode ? getPremiumArtifactTheme(row.commerceThemeCode) : undefined;
    if (!theme) {
      throw new BadRequestException('Intent is missing a resolved commerce theme');
    }
    const sku = row.productSku ?? theme.productSkus.officialPdf;
    const unitAmount = row.amountCents ?? theme.priceCents;
    row.productSku = sku;
    row.amountCents = unitAmount;
    row.lifecycleState = 'checkout_started';
    row.checkoutExternalId = `mock_cs_${this.ids.generate()}`;
    row.updatedAt = this.clock.now();
    const saved = await this.intents.save(row);
    void this.trackEvent.trackBestEffort({
      sessionId: args.sessionId,
      reportId: row.reportId,
      eventType: AnalyticsEventType.CHECKOUT_STARTED,
      payload: {
        intentId: row.id,
        checkoutSessionId: saved.checkoutExternalId,
        productSku: sku,
        commerceThemeCode: theme.code,
      },
    });
    return {
      intent: mapPremiumIntentEntityToDomain(saved),
      checkoutSessionId: saved.checkoutExternalId ?? '',
      provider: 'stripe_placeholder',
      lineItems: [{ sku, quantity: 1, unitAmountCents: unitAmount, currency: saved.currency }],
    };
  }

  async completeCheckoutStub(args: { intentId: string; sessionId: string }): Promise<PremiumIntent> {
    const row = await this.requireIntentRow(args.intentId, args.sessionId);
    if (row.lifecycleState !== 'checkout_started') {
      throw new BadRequestException('completeCheckoutStub requires lifecycle checkout_started');
    }
    row.lifecycleState = 'checkout_completed';
    const handoff = await this.fulfillmentHandoff.onCheckoutCompleted({
      intentId: args.intentId,
      sessionId: args.sessionId,
    });
    row.fulfillmentRef = handoff.fulfillmentRef ?? row.fulfillmentRef ?? `mock_ord_${this.ids.generate()}`;
    row.updatedAt = this.clock.now();
    let saved = await this.intents.save(row);
    void this.trackEvent.trackBestEffort({
      sessionId: args.sessionId,
      reportId: row.reportId,
      eventType: AnalyticsEventType.CHECKOUT_COMPLETED,
      payload: {
        intentId: row.id,
        fulfillmentRef: saved.fulfillmentRef,
        checkoutSessionId: saved.checkoutExternalId,
      },
    });

    saved.lifecycleState = 'artifact_fulfilled';
    saved.fulfilledAt = this.clock.now();
    saved.updatedAt = this.clock.now();
    saved = await this.intents.save(saved);
    void this.trackEvent.trackBestEffort({
      sessionId: args.sessionId,
      reportId: row.reportId,
      eventType: AnalyticsEventType.ARTIFACT_FULFILLED,
      payload: { intentId: row.id, fulfillmentRef: saved.fulfillmentRef, mode: 'stub_digital' },
    });
    return mapPremiumIntentEntityToDomain(saved);
  }

  async getMerchBundle(args: { intentId: string; sessionId: string }) {
    const row = await this.requireIntentRow(args.intentId, args.sessionId);
    if (!row.reportId) {
      throw new BadRequestException('Intent has no reportId');
    }
    if (row.lifecycleState === 'intent_created' || row.lifecycleState === 'offer_presented') {
      throw new BadRequestException('Merch bundle requires at least theme_selected');
    }
    const theme = row.commerceThemeCode ? getPremiumArtifactTheme(row.commerceThemeCode) : undefined;
    if (!theme) {
      throw new BadRequestException('Intent is missing commerceThemeCode');
    }
    const report = await this.requireOwnedReport(row.reportId, args.sessionId);
    return buildMerchReadyBundle({ report, theme });
  }

  async previewCertificate(args: {
    intentId: string;
    sessionId: string;
    certificateKind: 'official_pdf' | 'wall_print';
  }) {
    const row = await this.requireIntentRow(args.intentId, args.sessionId);
    if (!row.reportId) {
      throw new BadRequestException('Intent has no reportId');
    }
    if (row.lifecycleState === 'intent_created' || row.lifecycleState === 'offer_presented') {
      throw new BadRequestException('Certificate preview requires at least theme_selected');
    }
    const theme = row.commerceThemeCode ? getPremiumArtifactTheme(row.commerceThemeCode) : undefined;
    if (!theme) {
      throw new BadRequestException('Intent is missing commerceThemeCode');
    }
    void this.trackEvent.trackBestEffort({
      sessionId: args.sessionId,
      reportId: row.reportId,
      eventType: AnalyticsEventType.CERTIFICATE_PREVIEWED,
      payload: {
        intentId: row.id,
        certificateKind: args.certificateKind,
        pdfThemeCode: theme.pdfThemeCode,
      },
    });
    const artifact = await this.generatePdfReport.execute({
      reportId: row.reportId,
      sessionId: args.sessionId,
      themeCode: theme.pdfThemeCode,
    });
    return {
      artifactId: artifact.id,
      contentUrl: `/api/v1/artifacts/${artifact.id}/content`,
      certificateKind: args.certificateKind,
      pdfThemeCode: theme.pdfThemeCode,
    };
  }

  private async requireIntentRow(intentId: string, sessionId: string): Promise<PremiumIntentEntity> {
    const row = await this.intents.findOne({ where: { id: intentId } });
    if (!row) {
      throw new NotFoundException(`Intent ${intentId} not found`);
    }
    if (row.sessionId !== sessionId) {
      throw new ForbiddenException('Intent does not belong to this session');
    }
    return row;
  }

  private async requireOwnedReport(reportId: string, sessionId: string) {
    const report = await this.reports.findReportById(reportId);
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }
    if (report.sessionId && report.sessionId !== sessionId) {
      throw new ForbiddenException('Report does not belong to this session');
    }
    return report;
  }
}

function normalizeLifecycle(raw: string): PremiumCommerceLifecycleState {
  if (isPremiumCommerceLifecycleState(raw)) return raw;
  return 'intent_created';
}
