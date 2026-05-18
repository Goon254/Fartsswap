import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { OpsKeyGuard } from '../../../ops/interface/http/ops-key.guard';
import { GalleryApplicationService } from '../../application/gallery-application.service';
import type { GallerySubmissionStatus } from '../../domain/gallery-lifecycle';
import { GALLERY_SUBMISSION_STATUSES } from '../../domain/gallery-lifecycle';
import { GalleryModerateBodyDto, GallerySessionBlockBodyDto } from './dto/gallery-ops.dto';

function parseStatus(raw: string | undefined): GallerySubmissionStatus | undefined {
  if (!raw) return undefined;
  return GALLERY_SUBMISSION_STATUSES.includes(raw as GallerySubmissionStatus)
    ? (raw as GallerySubmissionStatus)
    : undefined;
}

@ApiTags('gallery-ops')
@Controller('api/v1/ops/gallery')
@UseGuards(OpsKeyGuard)
export class GalleryOpsController {
  constructor(private readonly gallery: GalleryApplicationService) {}

  @Get('queue')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Moderation queue (defaults to submitted_for_review)' })
  async queue(@Query('status') statusRaw?: string, @Query('limit') limitRaw?: string) {
    const status = parseStatus(statusRaw);
    const limit = limitRaw ? Number(limitRaw) : 50;
    return { items: await this.gallery.listQueue(status, Number.isFinite(limit) ? limit : 50) };
  }

  @Get('submissions/:id')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Ops detail for one submission' })
  async one(@Param('id') id: string) {
    return this.gallery.getOpsSubmission(id);
  }

  @Get('submissions/:id/decisions')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Audit trail for a submission' })
  async decisions(@Param('id') id: string) {
    const rows = await this.gallery.listDecisionLog(id);
    return {
      decisions: rows.map((r) => ({
        id: r.id,
        action: r.action,
        actorKind: r.actorKind,
        actorRef: r.actorRef,
        fromStatus: r.fromStatus,
        toStatus: r.toStatus,
        reasonCode: r.reasonCode,
        notes: r.notes,
        metadata: r.metadata,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  @Post('submissions/:id/moderate')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 120, windowSeconds: 60 })
  @ApiOperation({ summary: 'Approve / reject / publish / remove / feature / hide / clear reports' })
  async moderate(
    @Param('id') id: string,
    @Body() body: GalleryModerateBodyDto,
    @Req() request: FastifyRequest,
  ) {
    const raw = request.headers['x-ops-actor'];
    const operatorRef = Array.isArray(raw) ? raw[0] : raw;
    return this.gallery.moderate({
      submissionId: id,
      action: body.action,
      operatorRef: typeof operatorRef === 'string' ? operatorRef : undefined,
      reasonCode: body.reasonCode,
      notes: body.notes,
      featuredRank: body.featuredRank,
    });
  }

  @Post('session-blocks')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiCreatedResponse({ description: 'Block created' })
  @ApiOperation({ summary: 'Enforcement: block a session from submitting or reporting' })
  async addBlock(@Body() body: GallerySessionBlockBodyDto, @Req() request: FastifyRequest) {
    const raw = request.headers['x-ops-actor'];
    const operatorRef = Array.isArray(raw) ? raw[0] : raw;
    const expiresAt =
      body.expiresAt && body.expiresAt.trim().length > 0 ? new Date(body.expiresAt) : undefined;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('invalid expiresAt');
    }
    return this.gallery.createSessionBlock({
      sessionId: body.sessionId,
      restrictionKind: body.restrictionKind,
      reasonCode: body.reasonCode,
      notes: body.notes,
      createdBy: typeof operatorRef === 'string' ? operatorRef : 'ops',
      expiresAt,
    });
  }

  @Post('session-blocks/:id/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ max: 40, windowSeconds: 60 })
  async revokeBlock(@Param('id') id: string) {
    await this.gallery.revokeSessionBlock(id);
  }

  @Get('session-blocks')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'List blocks for a session (newest first)' })
  async listBlocks(@Query('sessionId') sessionId: string) {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new BadRequestException('sessionId query required');
    }
    const rows = await this.gallery.listSessionBlocks(sessionId.trim());
    return {
      blocks: rows.map((b) => ({
        id: b.id,
        sessionId: b.sessionId,
        restrictionKind: b.restrictionKind,
        reasonCode: b.reasonCode,
        notes: b.notes,
        createdBy: b.createdBy,
        expiresAt: b.expiresAt?.toISOString(),
        revokedAt: b.revokedAt?.toISOString(),
        createdAt: b.createdAt.toISOString(),
      })),
    };
  }
}
