import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AppConfigService } from '../../../config/config.service';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import type { CreatorFeatureKey } from '../domain/creator-feature-keys';
import { isCreatorFeatureKey } from '../domain/creator-feature-keys';
import { CreatorSubscriptionEntity } from '../infrastructure/persistence/creator-subscription.entity';
import { CreatorSubscriptionPlanFeatureEntity } from '../infrastructure/persistence/creator-subscription-plan-feature.entity';
import { CreatorSubscriptionUsagePeriodEntity } from '../infrastructure/persistence/creator-subscription-usage-period.entity';

export interface EntitlementCheckResult {
  readonly allowed: boolean;
  readonly enforcement: boolean;
  readonly featureKey: string;
  readonly subscriptionId?: string;
  readonly planCode?: string;
  readonly limit: number | null;
  readonly used: number;
  readonly remaining: number | null;
}

@Injectable()
export class EntitlementResolutionService {
  constructor(
    @InjectRepository(CreatorSubscriptionEntity)
    private readonly subscriptions: Repository<CreatorSubscriptionEntity>,
    @InjectRepository(CreatorSubscriptionPlanFeatureEntity)
    private readonly planFeatures: Repository<CreatorSubscriptionPlanFeatureEntity>,
    @InjectRepository(CreatorSubscriptionUsagePeriodEntity)
    private readonly usage: Repository<CreatorSubscriptionUsagePeriodEntity>,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly track: TrackAnalyticsEventUseCase,
    private readonly config: AppConfigService,
  ) {}

  private now(): Date {
    return this.clock.now();
  }

  private periodKey(d: Date): string {
    return d.toISOString().slice(0, 7);
  }

  async getActiveSubscription(sessionId: string): Promise<CreatorSubscriptionEntity | null> {
    const t = this.now();
    const rows = await this.subscriptions.find({
      where: {
        holderKind: 'anonymous_session',
        holderId: sessionId,
        status: In(['active', 'trialing', 'past_due']),
      },
      relations: ['plan'],
    });
    const open = rows.filter((s) => s.currentPeriodEnd > t);
    if (open.length === 0) return null;
    return open.sort((a, b) => b.currentPeriodEnd.getTime() - a.currentPeriodEnd.getTime())[0] ?? null;
  }

  async checkFeature(sessionId: string | undefined, featureKey: string): Promise<EntitlementCheckResult> {
    if (!isCreatorFeatureKey(featureKey)) {
      return {
        allowed: false,
        enforcement: this.config.creatorPlans.entitlementEnforcement,
        featureKey,
        limit: null,
        used: 0,
        remaining: null,
      };
    }
    const enforcement = this.config.creatorPlans.entitlementEnforcement;
    if (!sessionId) {
      void this.emitEntitlementChecked(sessionId, featureKey, false, undefined, undefined, enforcement);
      return {
        allowed: !enforcement,
        enforcement,
        featureKey,
        limit: null,
        used: 0,
        remaining: null,
      };
    }
    if (!enforcement) {
      void this.emitEntitlementChecked(sessionId, featureKey, true, undefined, undefined, enforcement);
      return {
        allowed: true,
        enforcement,
        featureKey,
        limit: null,
        used: 0,
        remaining: null,
      };
    }

    const sub = await this.getActiveSubscription(sessionId);
    if (!sub?.plan) {
      void this.emitEntitlementChecked(sessionId, featureKey, false, undefined, undefined, enforcement);
      return {
        allowed: false,
        enforcement,
        featureKey,
        limit: null,
        used: 0,
        remaining: 0,
      };
    }
    const feat = await this.planFeatures.findOne({
      where: { planId: sub.planId, featureKey },
    });
    if (!feat) {
      void this.emitEntitlementChecked(sessionId, featureKey, false, sub.id, sub.plan?.code, enforcement);
      return {
        allowed: false,
        enforcement,
        featureKey,
        subscriptionId: sub.id,
        planCode: sub.plan?.code,
        limit: null,
        used: 0,
        remaining: 0,
      };
    }
    const limit = feat.limitPerPeriod ?? null;
    const pk = this.periodKey(this.now());
    const row = await this.usage.findOne({
      where: { subscriptionId: sub.id, featureKey, periodKey: pk },
    });
    const used = row?.usedCount ?? 0;
    const remaining = limit === null ? null : Math.max(0, limit - used);
    const allowed = limit === null ? true : used < limit;
    void this.emitEntitlementChecked(sessionId, featureKey, allowed, sub.id, sub.plan?.code, enforcement);
    return {
      allowed,
      enforcement,
      featureKey,
      subscriptionId: sub.id,
      planCode: sub.plan?.code,
      limit,
      used,
      remaining,
    };
  }

  async assertCanConsume(args: {
    sessionId: string | undefined;
    featureKey: CreatorFeatureKey;
    units: number;
  }): Promise<void> {
    if (!this.config.creatorPlans.entitlementEnforcement) return;
    if (args.units <= 0) return;
    const r = await this.checkFeature(args.sessionId, args.featureKey);
    if (!r.allowed) {
      throw new ForbiddenException(`Entitlement ${args.featureKey} not available for this session`);
    }
    if (r.remaining !== null && r.remaining < args.units) {
      throw new ForbiddenException(`Insufficient ${args.featureKey} quota (${r.remaining} remaining)`);
    }
  }

  async consume(args: {
    sessionId: string;
    featureKey: CreatorFeatureKey;
    units: number;
    surface?: string;
  }): Promise<void> {
    if (!this.config.creatorPlans.entitlementEnforcement || args.units <= 0) return;
    const sub = await this.getActiveSubscription(args.sessionId);
    if (!sub) return;
    const pk = this.periodKey(this.now());
    let row = await this.usage.findOne({
      where: { subscriptionId: sub.id, featureKey: args.featureKey, periodKey: pk },
    });
    const t = this.now();
    if (!row) {
      row = this.usage.create({
        subscriptionId: sub.id,
        featureKey: args.featureKey,
        periodKey: pk,
        usedCount: args.units,
        updatedAt: t,
      });
    } else {
      row.usedCount += args.units;
      row.updatedAt = t;
    }
    await this.usage.save(row);
    void this.track.trackBestEffort({
      sessionId: args.sessionId,
      eventType: AnalyticsEventType.GATED_FEATURE_USED,
      payload: {
        featureKey: args.featureKey,
        units: args.units,
        subscriptionId: sub.id,
        surface: args.surface ?? 'unknown',
      },
    });
  }

  async snapshotForSession(sessionId: string): Promise<{
    subscription: { id: string; planCode?: string; status: string; periodEnd: string } | null;
    features: { key: string; limit: number | null; used: number; remaining: number | null }[];
  }> {
    const sub = await this.getActiveSubscription(sessionId);
    if (!sub?.plan) {
      return { subscription: null, features: [] };
    }
    const feats = await this.planFeatures.find({ where: { planId: sub.planId } });
    const pk = this.periodKey(this.now());
    const out: { key: string; limit: number | null; used: number; remaining: number | null }[] = [];
    for (const f of feats) {
      const row = await this.usage.findOne({
        where: { subscriptionId: sub.id, featureKey: f.featureKey, periodKey: pk },
      });
      const used = row?.usedCount ?? 0;
      const lim = f.limitPerPeriod ?? null;
      out.push({
        key: f.featureKey,
        limit: lim,
        used,
        remaining: lim === null ? null : Math.max(0, lim - used),
      });
    }
    return {
      subscription: {
        id: sub.id,
        planCode: sub.plan?.code,
        status: sub.status,
        periodEnd: sub.currentPeriodEnd.toISOString(),
      },
      features: out,
    };
  }

  private emitEntitlementChecked(
    sessionId: string | undefined,
    featureKey: string,
    allowed: boolean,
    subscriptionId: string | undefined,
    planCode: string | undefined,
    enforcement: boolean,
  ): void {
    void this.track.trackBestEffort({
      ...(sessionId ? { sessionId } : {}),
      eventType: AnalyticsEventType.ENTITLEMENT_CHECKED,
      payload: { featureKey, allowed, subscriptionId, planCode, enforcement },
    });
  }
}
