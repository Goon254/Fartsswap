import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { OpsKeyGuard } from '../../../ops/interface/http/ops-key.guard';
import { CreatorPlansAdminService } from '../../application/creator-plans-admin.service';
import { EntitlementResolutionService } from '../../application/entitlement-resolution.service';

class AssignTestPlanBodyDto {
  @IsUUID('4')
  sessionId!: string;

  @IsString()
  @IsIn(['creator_plan', 'community_plan', 'party_host_pack', 'brand_campaign_pack'])
  planCode!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  periodDays?: number;
}

class SimulateLifecycleBodyDto {
  @IsIn(['renew', 'cancel', 'past_due'])
  action!: 'renew' | 'cancel' | 'past_due';
}

@ApiTags('plans-ops')
@Controller('api/v1/ops/plans')
@UseGuards(OpsKeyGuard)
export class PlansOpsController {
  constructor(
    private readonly admin: CreatorPlansAdminService,
    private readonly entitlementResolution: EntitlementResolutionService,
  ) {}

  @Get('catalog')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Preview seeded creator/community plan catalog + feature caps' })
  async catalog() {
    const rows = await this.admin.listCatalog();
    return {
      plans: rows.map((p) => ({
        id: p.id,
        code: p.code,
        displayName: p.displayName,
        description: p.description,
        audience: p.audience,
        features: (p.features ?? []).map((f) => ({
          featureKey: f.featureKey,
          limitPerPeriod: f.limitPerPeriod,
        })),
      })),
    };
  }

  @Post('assign-test')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Invite-only: attach a test plan to an anonymous session' })
  @ApiOkResponse({ description: 'Subscription created' })
  async assignTest(@Body() body: AssignTestPlanBodyDto) {
    const sub = await this.admin.assignTestPlan({
      sessionId: body.sessionId,
      planCode: body.planCode,
      ...(body.periodDays !== undefined ? { periodDays: body.periodDays } : {}),
    });
    return {
      subscriptionId: sub.id,
      planId: sub.planId,
      holderId: sub.holderId,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    };
  }

  @Get('sessions/:sessionId/entitlements')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Inspect effective entitlements + monthly usage for a session' })
  async entitlements(@Param('sessionId') sessionId: string) {
    return this.entitlementResolution.snapshotForSession(sessionId);
  }

  @Get('subscriptions/:subscriptionId/billing-events')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Billing lifecycle audit for a subscription' })
  async billingEvents(
    @Param('subscriptionId') subscriptionId: string,
    @Query('limit') limitRaw?: string,
  ) {
    const limit = limitRaw ? Number(limitRaw) : 40;
    const rows = await this.admin.listBillingEvents(subscriptionId, Number.isFinite(limit) ? limit : 40);
    return {
      events: rows.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        payload: e.payload,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  @Post('subscriptions/:subscriptionId/simulate')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Simulate renew / cancel / past_due for operator testing' })
  async simulate(@Param('subscriptionId') subscriptionId: string, @Body() body: SimulateLifecycleBodyDto) {
    const sub = await this.admin.simulateLifecycle({ subscriptionId, action: body.action });
    return {
      subscriptionId: sub.id,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    };
  }
}
