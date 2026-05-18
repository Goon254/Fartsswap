import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import {
  IngestClientAnalyticsUseCase,
  parseClientAnalyticsBatch,
  parseClientAnalyticsRecord,
} from '../../application/ingest-client-analytics.use-case';

@ApiTags('analytics')
@Controller('api/v1/analytics')
export class AnalyticsIngestController {
  constructor(
    private readonly ingest: IngestClientAnalyticsUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  @RateLimit({ max: 120, windowSeconds: 60 })
  @ApiOperation({ summary: 'Persist one browser analytics record (sendBeacon / fetch)' })
  @ApiBody({
    description: 'Same shape as `AnalyticsRecord` from the web client',
  })
  @ApiCreatedResponse({ description: 'Accepted' })
  async ingestOne(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ ok: true }> {
    const record = parseClientAnalyticsRecord(body);
    await this.handleRecords([record], request, reply);
    return { ok: true };
  }

  @Post('events/batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Persist multiple browser analytics records' })
  @ApiCreatedResponse({ description: 'Accepted' })
  async ingestBatch(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ ok: true; count: number }> {
    const records = parseClientAnalyticsBatch(body);
    await this.handleRecords(records, request, reply);
    return { ok: true, count: records.length };
  }

  private async handleRecords(
    records: ReturnType<typeof parseClientAnalyticsRecord>[],
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    for (const r of records) {
      await this.ingest.execute(session.id, r);
    }
  }
}
