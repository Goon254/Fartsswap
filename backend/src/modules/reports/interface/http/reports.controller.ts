import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import { resolveClientIp } from '../../../../shared/interface/http/client-ip';
import { Idempotent } from '../../../../shared/interface/http/idempotency.decorator';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { CreateReportFromAudioUseCase } from '../../application/create-report-from-audio.use-case';
import { GenerateFakeReportUseCase } from '../../application/generate-fake-report.use-case';
import { GetReportAudioContentUseCase } from '../../application/get-report-audio-content.use-case';
import { GetReportBySlugUseCase } from '../../application/get-report-by-slug.use-case';
import { GetReportUseCase } from '../../application/get-report.use-case';
import { CreateReportFromAudioDto } from './dto/create-report-from-audio.dto';
import { GenerateFakeReportDto } from './dto/generate-fake-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';

@ApiTags('reports')
@Controller('api/v1/reports')
export class ReportsController {
  constructor(
    private readonly generateFakeReport: GenerateFakeReportUseCase,
    private readonly createReportFromAudio: CreateReportFromAudioUseCase,
    private readonly getReport: GetReportUseCase,
    private readonly getReportAudio: GetReportAudioContentUseCase,
    private readonly getReportBySlug: GetReportBySlugUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post('fake')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 10, windowSeconds: 60 })
  @Idempotent({ scope: 'reports:fake' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Optional UUID. Replays the same response within the TTL window.',
  })
  @ApiOperation({ summary: 'Generate a fake fart report (no AI)' })
  @ApiCreatedResponse({ type: ReportResponseDto })
  async createFake(
    @Body() body: GenerateFakeReportDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ReportResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);

    const report = await this.generateFakeReport.execute({
      sessionId: session.id,
      customFartName: body.customFartName,
      tonePreset: body.tonePreset,
      ipAddress: resolveClientIp(request),
    });

    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    return ReportResponseDto.fromDomain(report);
  }

  @Post('from-audio')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 10, windowSeconds: 60 })
  @Idempotent({ scope: 'reports:from-audio' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Optional UUID. Replays the same response within the TTL window.',
  })
  @ApiOperation({ summary: 'Create a report from an uploaded audio clip (placeholder analysis)' })
  @ApiCreatedResponse({ type: ReportResponseDto })
  async createFromAudio(
    @Body() body: CreateReportFromAudioDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ReportResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);

    const report = await this.createReportFromAudio.execute({
      audioUploadId: body.audioUploadId,
      sessionId: session.id,
      customFartName: body.customFartName,
      tonePreset: body.tonePreset,
      ipAddress: resolveClientIp(request),
    });

    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    return ReportResponseDto.fromDomain(report);
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get a report by public slug' })
  @ApiOkResponse({ type: ReportResponseDto })
  async findBySlug(
    @Param('slug') slug: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ReportResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    const report = await this.getReportBySlug.execute(slug, session.id);
    return ReportResponseDto.fromDomain(report);
  }

  @Get(':id/audio')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({
    summary: 'Stream session-owned audio for a report (private playback; same session only)',
  })
  @ApiOkResponse({ description: 'Raw audio bytes for the captured specimen' })
  async streamAudio(
    @Param('id') id: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    const { body, contentType } = await this.getReportAudio.getContent(id, session.id);
    void reply.header('Content-Type', contentType);
    void reply.header('Cache-Control', 'private, no-store');
    void reply.send(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiOkResponse({ type: ReportResponseDto })
  async findOne(
    @Param('id') id: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ReportResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    const report = await this.getReport.execute(id, session.id);
    const playback = await this.getReportAudio.getPlaybackMeta(id, session.id);
    return ReportResponseDto.fromDomain(report, playback);
  }
}
