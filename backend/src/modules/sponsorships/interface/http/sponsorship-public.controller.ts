import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { SponsorshipAttributionService } from '../../application/sponsorship-attribution.service';
import { SponsorshipResolveService } from '../../application/sponsorship-resolve.service';
import { parseSlotCsv } from '../../domain/sponsorship-creative.validator';
import type { SponsorshipPlacementSurfaceDto, SponsorshipSlotCode } from '../../domain/sponsorship-slots';

export interface SponsorshipPlacementPublicResponse {
  slotCode: string;
  campaignId: string;
  placementId: string;
  sponsorPublicLabel: string;
  creative: Record<string, unknown>;
}

class RecordAttributionBody {
  placementId!: string;
  eventType!: 'served' | 'click' | 'preview';
  metadata?: Record<string, unknown>;
}

@ApiTags('sponsorship')
@Controller('api/v1/sponsorship')
export class SponsorshipPublicController {
  constructor(
    private readonly resolve: SponsorshipResolveService,
    private readonly attributions: SponsorshipAttributionService,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Get('resolve')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Resolve active ceremonial placements for slot codes (comma-separated)' })
  @ApiOkResponse({ description: 'Public placement payloads' })
  async resolveSlots(
    @Query('slots') slotsRaw: string | undefined,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ placements: SponsorshipPlacementPublicResponse[] }> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const slots = parseSlotCsv(slotsRaw) as SponsorshipSlotCode[];
    const resolved = await this.resolve.resolveActiveSlots(slots, {
      sessionId: session.id,
      trackServed: true,
    });
    const placements: SponsorshipPlacementPublicResponse[] = resolved.map((p: SponsorshipPlacementSurfaceDto) => ({
      slotCode: p.slotCode,
      campaignId: p.campaignId,
      placementId: p.placementId,
      sponsorPublicLabel: p.sponsorPublicLabel,
      creative: { ...p.creative },
    }));
    return { placements };
  }

  @Post('attributions')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Record sponsorship attribution (click, served replay, preview)' })
  @ApiCreatedResponse({ description: 'Accepted' })
  async recordAttribution(
    @Body() body: RecordAttributionBody,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ ok: true }> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    await this.attributions.record({
      placementId: body.placementId,
      eventType: body.eventType,
      sessionId: session.id,
      metadata: body.metadata,
    });
    return { ok: true };
  }
}
