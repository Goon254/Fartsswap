import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { GalleryApplicationService } from '../../application/gallery-application.service';
import { CreateGallerySubmissionDto, FileGalleryReportDto } from './dto/gallery-public.dto';

@ApiTags('gallery')
@Controller('api/v1/gallery')
export class GalleryPublicController {
  constructor(
    private readonly gallery: GalleryApplicationService,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post('submissions')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 8, windowSeconds: 3600 })
  @ApiOperation({
    summary: 'Opt a completed report into the bureau gallery review queue (session-owned reports only)',
  })
  @ApiCreatedResponse({ description: 'Submission created or updated' })
  async createSubmission(
    @Body() body: CreateGallerySubmissionDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    return this.gallery.submitForReview({
      sessionId: session.id,
      reportId: body.reportId,
      reportArtifactId: body.reportArtifactId,
    });
  }

  @Get('submissions/by-report/:reportId')
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Read gallery submission status for a report you own' })
  @ApiOkResponse({ description: 'Submission row or null' })
  async submissionForReport(
    @Param('reportId') reportId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const row = await this.gallery.getSubmissionForReportAndSession(session.id, reportId);
    return { submission: row };
  }

  @Get('feed/:submissionId/audio')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({
    summary:
      'Stream audio for a published feed item only (not session-private report playback)',
  })
  @ApiOkResponse({ description: 'Published feed specimen audio bytes' })
  async feedAudio(
    @Param('submissionId') submissionId: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const { body, contentType } = await this.gallery.getPublishedFeedAudioContent(submissionId);
    void reply.header('Content-Type', contentType);
    void reply.header('Cache-Control', 'public, max-age=300');
    void reply.send(body);
  }

  @Get('feed')
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({
    summary: 'Public moderated feed (disabled until GALLERY_PUBLIC_FEED_ENABLED=true)',
  })
  @ApiOkResponse({ description: 'Approved published items with dossier metadata' })
  async feed(@Query('limit') limitRaw?: string) {
    const limit = limitRaw ? Number(limitRaw) : 24;
    return this.gallery.listPublicFeed(Number.isFinite(limit) ? limit : 24);
  }

  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 20, windowSeconds: 3600 })
  @ApiOperation({ summary: 'Flag a published gallery item (one report per session per item)' })
  @ApiCreatedResponse({ description: 'Stored' })
  async fileReport(
    @Body() body: FileGalleryReportDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    return this.gallery.fileReport({
      reporterSessionId: session.id,
      submissionId: body.submissionId,
      reasonCode: body.reasonCode,
      details: body.details,
    });
  }
}
