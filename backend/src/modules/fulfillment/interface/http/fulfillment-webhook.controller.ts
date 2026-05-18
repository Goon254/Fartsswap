import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppConfigService } from '../../../../config/config.service';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { isPodOrderStatus } from '../../domain/pod-product-types';
import { PodFulfillmentOrchestrationService } from '../../application/pod-fulfillment-orchestration.service';

class MockPodWebhookBody {
  orderId!: string;
  status!: string;
  reason?: string;
}

@ApiTags('fulfillment')
@Controller('api/v1/fulfillment/webhooks')
export class FulfillmentWebhookController {
  constructor(
    private readonly pod: PodFulfillmentOrchestrationService,
    private readonly config: AppConfigService,
  ) {}

  @Post('mock')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 120, windowSeconds: 60 })
  @ApiOperation({
    summary: 'Mock POD status callback (maps provider-style updates into internal fulfillment state)',
  })
  @ApiOkResponse({ description: 'Applied' })
  async mockWebhook(@Body() body: MockPodWebhookBody, @Req() request: FastifyRequest): Promise<{ ok: true }> {
    const secret = this.config.podFulfillment.webhookSecret;
    if (secret) {
      const raw = request.headers['x-pod-webhook-secret'];
      const key = Array.isArray(raw) ? raw[0] : raw;
      if (key !== secret) {
        throw new ForbiddenException('invalid webhook secret');
      }
    }
    if (!body.orderId || typeof body.status !== 'string' || !isPodOrderStatus(body.status)) {
      throw new BadRequestException('invalid payload');
    }
    await this.pod.applyExternalStatus({
      orderId: body.orderId,
      nextStatus: body.status,
      reason: body.reason ?? 'mock_webhook',
    });
    return { ok: true };
  }
}
