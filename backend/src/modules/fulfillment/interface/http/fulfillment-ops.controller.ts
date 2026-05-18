import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { OpsKeyGuard } from '../../../ops/interface/http/ops-key.guard';
import { isPodOrderStatus } from '../../domain/pod-product-types';
import { PodFulfillmentOrchestrationService } from '../../application/pod-fulfillment-orchestration.service';

class OpsFulfillmentStatusBody {
  status!: string;
  reason?: string;
}

@ApiTags('fulfillment-ops')
@Controller('api/v1/ops/fulfillment')
@UseGuards(OpsKeyGuard)
export class FulfillmentOpsController {
  constructor(private readonly pod: PodFulfillmentOrchestrationService) {}

  @Get('orders')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'List recent POD fulfillment orders' })
  async list(@Query('limit') limitRaw?: string) {
    const limit = limitRaw ? Number(limitRaw) : 40;
    const rows = await this.pod.listOrders(Number.isFinite(limit) ? limit : 40);
    return {
      orders: rows.map((o) => ({
        id: o.id,
        premiumIntentId: o.premiumIntentId,
        sessionId: o.sessionId,
        reportId: o.reportId,
        status: o.status,
        providerCode: o.providerCode,
        providerOrderRef: o.providerOrderRef,
        currency: o.currency,
        amountCents: o.amountCents,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
    };
  }

  @Get('orders/:id')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Inspect one order with items + event history' })
  async detail(@Param('id') id: string) {
    const { order, items, events } = await this.pod.getOrderDetail(id);
    return {
      order: {
        id: order.id,
        premiumIntentId: order.premiumIntentId,
        sessionId: order.sessionId,
        reportId: order.reportId,
        status: order.status,
        providerCode: order.providerCode,
        providerOrderRef: order.providerOrderRef,
        packagedAssets: order.packagedAssets,
        shippingSummary: order.shippingSummary,
        currency: order.currency,
        amountCents: order.amountCents,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      },
      items: items.map((i) => ({
        id: i.id,
        podProductType: i.podProductType,
        commerceSku: i.commerceSku,
        quantity: i.quantity,
        personalization: i.personalization,
        providerLineRef: i.providerLineRef,
        lineStatus: i.lineStatus,
      })),
      events: events.map((e) => ({
        id: e.id,
        previousStatus: e.previousStatus,
        newStatus: e.newStatus,
        reason: e.reason,
        metadata: e.metadata,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  @Post('orders/:id/status')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOkResponse({ description: 'Status advanced' })
  @ApiOperation({ summary: 'Operator/simulator: force order status (mock integrations)' })
  async setStatus(@Param('id') id: string, @Body() body: OpsFulfillmentStatusBody) {
    if (!isPodOrderStatus(body.status)) {
      throw new BadRequestException('invalid status');
    }
    await this.pod.applyExternalStatus({
      orderId: id,
      nextStatus: body.status,
      reason: body.reason ?? 'ops_manual',
    });
    return { ok: true };
  }
}
