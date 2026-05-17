import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { CreateReportFromAudioUseCase } from '../../application/create-report-from-audio.use-case';
import { GenerateFakeReportUseCase } from '../../application/generate-fake-report.use-case';
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
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post('fake')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a fake fart report (no AI)' })
  @ApiCreatedResponse({ type: ReportResponseDto })
  async createFake(
    @Body() body: GenerateFakeReportDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ReportResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = this.readSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);

    const report = await this.generateFakeReport.execute({
      sessionId: session.id,
      customFartName: body.customFartName,
      tonePreset: body.tonePreset,
    });

    this.setSessionCookie(reply, cookieName, session.id);

    return ReportResponseDto.fromDomain(report);
  }

  @Post('from-audio')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a report from an uploaded audio clip (placeholder analysis)' })
  @ApiCreatedResponse({ type: ReportResponseDto })
  async createFromAudio(
    @Body() body: CreateReportFromAudioDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ReportResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = this.readSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);

    const report = await this.createReportFromAudio.execute({
      audioUploadId: body.audioUploadId,
      sessionId: session.id,
      customFartName: body.customFartName,
      tonePreset: body.tonePreset,
    });

    this.setSessionCookie(reply, cookieName, session.id);
    return ReportResponseDto.fromDomain(report);
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
    const existingSessionId = this.readSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    this.setSessionCookie(reply, cookieName, session.id);

    const report = await this.getReport.execute(id, session.id);
    return ReportResponseDto.fromDomain(report);
  }

  private readSessionCookie(request: FastifyRequest, cookieName: string): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[cookieName];
  }

  private setSessionCookie(reply: FastifyReply, cookieName: string, sessionId: string): void {
    const maxAge = this.config.session.ttlSeconds;
    void reply.setCookie(cookieName, sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge,
      secure: this.config.isProduction,
    });
  }
}
