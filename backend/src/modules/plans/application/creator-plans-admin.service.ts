import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { SUBSCRIPTION_BILLING_PORT, type SubscriptionBillingPort } from './ports/subscription-billing.port';
import { BillingCustomerEntity } from '../infrastructure/persistence/billing-customer.entity';
import { BillingLifecycleEventEntity } from '../infrastructure/persistence/billing-lifecycle-event.entity';
import { CreatorSubscriptionEntity } from '../infrastructure/persistence/creator-subscription.entity';
import { CreatorSubscriptionPlanEntity } from '../infrastructure/persistence/creator-subscription-plan.entity';

const ACTIVE_STATUSES = ['trialing', 'active', 'past_due'] as const;

@Injectable()
export class CreatorPlansAdminService {
  constructor(
    @InjectRepository(CreatorSubscriptionPlanEntity)
    private readonly plans: Repository<CreatorSubscriptionPlanEntity>,
    @InjectRepository(CreatorSubscriptionEntity)
    private readonly subscriptions: Repository<CreatorSubscriptionEntity>,
    @InjectRepository(BillingCustomerEntity)
    private readonly customers: Repository<BillingCustomerEntity>,
    @InjectRepository(BillingLifecycleEventEntity)
    private readonly billingEvents: Repository<BillingLifecycleEventEntity>,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly track: TrackAnalyticsEventUseCase,
    @Inject(SUBSCRIPTION_BILLING_PORT) private readonly billing: SubscriptionBillingPort,
  ) {}

  private now(): Date {
    return this.clock.now();
  }

  async listCatalog(): Promise<CreatorSubscriptionPlanEntity[]> {
    return this.plans.find({ where: { active: true }, order: { sortOrder: 'ASC' }, relations: ['features'] });
  }

  async assignTestPlan(args: { sessionId: string; planCode: string; periodDays?: number }): Promise<CreatorSubscriptionEntity> {
    const plan = await this.plans.findOne({ where: { code: args.planCode, active: true } });
    if (!plan) {
      throw new NotFoundException(`Unknown plan code ${args.planCode}`);
    }
    const days = args.periodDays ?? 30;
    const t = this.now();
    const periodEnd = new Date(t.getTime() + days * 86_400_000);

    await this.subscriptions
      .createQueryBuilder()
      .update(CreatorSubscriptionEntity)
      .set({ status: 'canceled', updatedAt: t })
      .where('holder_kind = :hk', { hk: 'anonymous_session' })
      .andWhere('holder_id = :hid', { hid: args.sessionId })
      .andWhere('status IN (:...st)', { st: [...ACTIVE_STATUSES] })
      .execute();

    const bill = await this.billing.startMockSubscription({
      holderKind: 'anonymous_session',
      holderId: args.sessionId,
      planCode: plan.code,
      periodDays: days,
    });

    let cust = await this.customers.findOne({
      where: { holderKind: 'anonymous_session', holderId: args.sessionId, providerCode: 'mock' },
    });
    if (!cust) {
      cust = this.customers.create({
        holderKind: 'anonymous_session',
        holderId: args.sessionId,
        providerCode: 'mock',
        externalRef: bill.billingCustomerRef,
        createdAt: t,
      });
      await this.customers.save(cust);
    }

    const sub = this.subscriptions.create({
      id: this.ids.generate(),
      planId: plan.id,
      holderKind: 'anonymous_session',
      holderId: args.sessionId,
      status: 'active',
      billingProvider: 'mock',
      billingCustomerRef: bill.billingCustomerRef,
      billingSubscriptionRef: bill.billingSubscriptionRef,
      currentPeriodStart: t,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      createdAt: t,
      updatedAt: t,
    });
    await this.subscriptions.save(sub);

    const ev = this.billingEvents.create({
      subscriptionId: sub.id,
      holderKind: 'anonymous_session',
      holderId: args.sessionId,
      eventType: 'subscription_started',
      payload: { planCode: plan.code, periodDays: days },
      createdAt: t,
    });
    await this.billingEvents.save(ev);

    void this.track.trackBestEffort({
      sessionId: args.sessionId,
      eventType: AnalyticsEventType.PLAN_ASSIGNED,
      payload: { planCode: plan.code, subscriptionId: sub.id, mode: 'ops_test' },
    });
    void this.track.trackBestEffort({
      sessionId: args.sessionId,
      eventType: AnalyticsEventType.SUBSCRIPTION_STARTED,
      payload: { planCode: plan.code, subscriptionId: sub.id },
    });

    return sub;
  }

  async simulateLifecycle(args: {
    subscriptionId: string;
    action: 'renew' | 'cancel' | 'past_due';
  }): Promise<CreatorSubscriptionEntity> {
    const sub = await this.subscriptions.findOne({ where: { id: args.subscriptionId } });
    if (!sub) throw new NotFoundException('subscription not found');
    const t = this.now();
    if (args.action === 'renew') {
      sub.currentPeriodEnd = new Date(sub.currentPeriodEnd.getTime() + 30 * 86_400_000);
      sub.status = 'active';
      sub.updatedAt = t;
      await this.subscriptions.save(sub);
      await this.appendBillingEvent(sub, 'subscription_renewed', { newPeriodEnd: sub.currentPeriodEnd.toISOString() });
      void this.track.trackBestEffort({
        sessionId: sub.holderId,
        eventType: AnalyticsEventType.SUBSCRIPTION_RENEWED,
        payload: { subscriptionId: sub.id },
      });
      return sub;
    }
    if (args.action === 'cancel') {
      sub.status = 'canceled';
      sub.updatedAt = t;
      await this.subscriptions.save(sub);
      await this.appendBillingEvent(sub, 'subscription_canceled', {});
      void this.track.trackBestEffort({
        sessionId: sub.holderId,
        eventType: AnalyticsEventType.SUBSCRIPTION_CANCELED,
        payload: { subscriptionId: sub.id },
      });
      return sub;
    }
    if (args.action === 'past_due') {
      sub.status = 'past_due';
      sub.updatedAt = t;
      await this.subscriptions.save(sub);
      await this.appendBillingEvent(sub, 'subscription_past_due', {});
      return sub;
    }
    throw new BadRequestException('unknown action');
  }

  private async appendBillingEvent(
    sub: CreatorSubscriptionEntity,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const ev = this.billingEvents.create({
      subscriptionId: sub.id,
      holderKind: sub.holderKind,
      holderId: sub.holderId,
      eventType,
      payload,
      createdAt: this.now(),
    });
    await this.billingEvents.save(ev);
  }

  async listBillingEvents(subscriptionId: string, limit = 50): Promise<BillingLifecycleEventEntity[]> {
    const cap = Math.min(Math.max(limit, 1), 200);
    return this.billingEvents.find({
      where: { subscriptionId },
      order: { createdAt: 'DESC' },
      take: cap,
    });
  }
}
