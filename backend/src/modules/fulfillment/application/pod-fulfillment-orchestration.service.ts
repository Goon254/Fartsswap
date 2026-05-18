import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { buildMerchReadyBundle } from '../../artifact-commerce/domain/merch-ready-bundle';
import { getPremiumArtifactTheme } from '../../artifact-commerce/domain/premium-artifact-catalog';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { buildPodAssetPackage } from '../domain/pod-asset-package';
import type { PodOrderStatus } from '../domain/pod-product-types';
import { commerceSkuToPodLineDrafts } from '../domain/sku-to-pod-lines';
import { POD_PROVIDER_PORT, type PodProviderPort } from './ports/pod-provider.port';
import { PodFulfillmentEventEntity } from '../infrastructure/persistence/pod-fulfillment-event.entity';
import { PodFulfillmentOrderItemEntity } from '../infrastructure/persistence/pod-fulfillment-order-item.entity';
import { PodFulfillmentOrderEntity } from '../infrastructure/persistence/pod-fulfillment-order.entity';
import type { PremiumIntentEntity } from '../../commerce/infrastructure/persistence/premium-intent.entity';

@Injectable()
export class PodFulfillmentOrchestrationService {
  private readonly logger = new Logger(PodFulfillmentOrchestrationService.name);

  constructor(
    @InjectRepository(PodFulfillmentOrderEntity)
    private readonly orders: Repository<PodFulfillmentOrderEntity>,
    @InjectRepository(PodFulfillmentOrderItemEntity)
    private readonly items: Repository<PodFulfillmentOrderItemEntity>,
    @InjectRepository(PodFulfillmentEventEntity)
    private readonly events: Repository<PodFulfillmentEventEntity>,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly track: TrackAnalyticsEventUseCase,
    @Inject(POD_PROVIDER_PORT) private readonly provider: PodProviderPort,
  ) {}

  private now(): Date {
    return this.clock.now();
  }

  async createAndSubmitFromIntent(args: {
    intentRow: PremiumIntentEntity;
    sessionId: string;
    providerMode: 'mock' | 'disabled';
  }): Promise<{ orderId: string; providerOrderRef?: string; status: PodOrderStatus }> {
    const row = args.intentRow;
    if (!row.reportId) {
      throw new BadRequestException('intent missing reportId for fulfillment');
    }
    const existing = await this.orders.findOne({ where: { premiumIntentId: row.id } });
    if (existing) {
      if (existing.status === 'failed') {
        await this.orders.delete({ id: existing.id });
      } else {
        return {
          orderId: existing.id,
          providerOrderRef: existing.providerOrderRef,
          status: existing.status as PodOrderStatus,
        };
      }
    }

    const themeCode = row.commerceThemeCode;
    if (!themeCode) {
      throw new BadRequestException('intent missing commerceThemeCode');
    }
    const theme = getPremiumArtifactTheme(themeCode);
    if (!theme) {
      throw new BadRequestException('unknown commerce theme');
    }
    const report = await this.reports.findReportById(row.reportId);
    if (!report) {
      throw new NotFoundException('report not found for fulfillment');
    }

    const bundle = buildMerchReadyBundle({ report, theme });
    const sku = row.productSku ?? theme.productSkus.officialPdf;
    const lines = commerceSkuToPodLineDrafts({ productSku: sku, theme });
    const primaryType = lines[0]?.podProductType ?? 'official_pdf_certificate';
    const assetPackage = buildPodAssetPackage({ bundle, primaryPodProductType: primaryType });

    void this.track.trackBestEffort({
      sessionId: args.sessionId,
      reportId: row.reportId,
      eventType: AnalyticsEventType.MERCH_ASSET_PACKAGED,
      payload: {
        intentId: row.id,
        commerceThemeCode: theme.code,
        lineCount: lines.length,
        primaryProduct: primaryType,
      },
    });

    const t = this.now();
    const orderId = this.ids.generate();
    const order = this.orders.create({
      id: orderId,
      premiumIntentId: row.id,
      sessionId: args.sessionId,
      reportId: row.reportId,
      status: 'submitted',
      providerCode: args.providerMode === 'disabled' ? 'disabled' : 'mock',
      packagedAssets: assetPackage as unknown as Record<string, unknown>,
      currency: row.currency ?? 'USD',
      amountCents: row.amountCents ?? undefined,
      createdAt: t,
      updatedAt: t,
    });
    await this.orders.save(order);

    for (const line of lines) {
      const item = this.items.create({
        id: this.ids.generate(),
        orderId,
        podProductType: line.podProductType,
        commerceSku: line.commerceSku,
        quantity: line.quantity,
        personalization: {
          headline: assetPackage.personalization.headline,
          classification: assetPackage.personalization.classification,
          sealLabel: assetPackage.personalization.sealLabel,
          ...(assetPackage.personalization.badgeLabel !== undefined
            ? { badgeLabel: assetPackage.personalization.badgeLabel }
            : {}),
          ...(assetPackage.personalization.publicSlug !== undefined
            ? { publicSlug: assetPackage.personalization.publicSlug }
            : {}),
        },
        lineStatus: 'pending',
        createdAt: t,
        updatedAt: t,
      });
      await this.items.save(item);
    }

    await this.appendEvent(orderId, undefined, 'submitted', 'order_created', {
      intentId: row.id,
      lineCount: lines.length,
    });

    void this.track.trackBestEffort({
      sessionId: args.sessionId,
      reportId: row.reportId,
      eventType: AnalyticsEventType.COMMERCE_ORDER_CREATED,
      payload: { intentId: row.id, fulfillmentOrderId: orderId, providerMode: args.providerMode },
    });

    if (args.providerMode === 'disabled') {
      order.updatedAt = this.now();
      await this.orders.save(order);
      return { orderId, status: 'submitted' };
    }

    try {
      const submitted = await this.provider.submitOrder({
        internalOrderId: orderId,
        providerCode: 'mock',
        lines,
        assetPackage,
        currency: order.currency,
        amountCents: order.amountCents ?? undefined,
      });
      order.providerOrderRef = submitted.providerOrderRef;
      order.status = submitted.initialStatus === 'accepted' ? 'accepted' : 'submitted';
      order.updatedAt = this.now();
      await this.orders.save(order);

      const savedItems = await this.items.find({ where: { orderId } });
      for (let i = 0; i < savedItems.length; i++) {
        const it = savedItems[i]!;
        const ref = submitted.lineRefs.find((r) => r.commerceSku === it.commerceSku);
        it.providerLineRef = ref?.providerLineRef ?? submitted.lineRefs[i]?.providerLineRef;
        it.lineStatus = order.status === 'accepted' ? 'submitted' : 'pending';
        it.updatedAt = this.now();
        await this.items.save(it);
      }

      await this.appendEvent(orderId, 'submitted', order.status, 'provider_submit_ok', {
        providerOrderRef: submitted.providerOrderRef,
      });

      void this.track.trackBestEffort({
        sessionId: args.sessionId,
        reportId: row.reportId,
        eventType: AnalyticsEventType.FULFILLMENT_SUBMITTED,
        payload: {
          intentId: row.id,
          fulfillmentOrderId: orderId,
          providerOrderRef: submitted.providerOrderRef,
        },
      });

      return { orderId, providerOrderRef: submitted.providerOrderRef, status: order.status as PodOrderStatus };
    } catch (e) {
      this.logger.warn({ err: e, orderId }, 'POD provider submit failed');
      order.status = 'failed';
      order.updatedAt = this.now();
      await this.orders.save(order);
      await this.appendEvent(orderId, 'submitted', 'failed', 'provider_submit_failed', {
        message: e instanceof Error ? e.message : 'unknown',
      });
      void this.track.trackBestEffort({
        sessionId: args.sessionId,
        reportId: row.reportId,
        eventType: AnalyticsEventType.FULFILLMENT_FAILED,
        payload: { intentId: row.id, fulfillmentOrderId: orderId },
      });
      throw e;
    }
  }

  async applyExternalStatus(args: {
    orderId: string;
    nextStatus: PodOrderStatus;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const order = await this.orders.findOne({ where: { id: args.orderId } });
    if (!order) throw new NotFoundException('fulfillment order not found');
    const prev = order.status;
    order.status = args.nextStatus;
    order.updatedAt = this.now();
    await this.orders.save(order);
    await this.appendEvent(order.id, prev, args.nextStatus, args.reason ?? 'webhook', args.metadata);

    if (args.nextStatus === 'shipped') {
      void this.track.trackBestEffort({
        sessionId: order.sessionId,
        reportId: order.reportId,
        eventType: AnalyticsEventType.FULFILLMENT_SHIPPED,
        payload: { fulfillmentOrderId: order.id, providerOrderRef: order.providerOrderRef },
      });
    }
    if (args.nextStatus === 'failed') {
      void this.track.trackBestEffort({
        sessionId: order.sessionId,
        reportId: order.reportId,
        eventType: AnalyticsEventType.FULFILLMENT_FAILED,
        payload: { fulfillmentOrderId: order.id },
      });
    }
  }

  async listOrders(limit: number): Promise<PodFulfillmentOrderEntity[]> {
    const cap = Math.min(Math.max(limit, 1), 200);
    return this.orders.find({ order: { createdAt: 'DESC' }, take: cap });
  }

  async getOrderDetail(id: string): Promise<{
    order: PodFulfillmentOrderEntity;
    items: PodFulfillmentOrderItemEntity[];
    events: PodFulfillmentEventEntity[];
  }> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException('fulfillment order not found');
    const [orderItems, evs] = await Promise.all([
      this.items.find({ where: { orderId: id }, order: { createdAt: 'ASC' } }),
      this.events.find({ where: { orderId: id }, order: { createdAt: 'DESC' }, take: 100 }),
    ]);
    return { order, items: orderItems, events: evs };
  }

  private async appendEvent(
    orderId: string,
    previous: string | undefined,
    next: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const ev = this.events.create({
      id: this.ids.generate(),
      orderId,
      previousStatus: previous,
      newStatus: next,
      reason,
      metadata,
      createdAt: this.now(),
    });
    await this.events.save(ev);
  }
}
