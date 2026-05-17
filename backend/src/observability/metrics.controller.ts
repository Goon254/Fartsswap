import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service';

/**
 * Prometheus scrape endpoint.
 *
 * Path defaults to /metrics (configurable via METRICS_PATH). Excluded from
 * the public OpenAPI doc; intended for internal scrapers only.
 *
 * If you expose this on the public internet, put it behind a network
 * allowlist or basic auth — it leaks process and traffic data.
 */
@ApiExcludeController()
@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @Header('Cache-Control', 'no-store')
  async scrape(@Res({ passthrough: false }) reply: FastifyReply): Promise<void> {
    const payload = await this.metrics.snapshot();
    void reply.header('Content-Type', this.metrics.contentType());
    void reply.send(payload);
  }
}
