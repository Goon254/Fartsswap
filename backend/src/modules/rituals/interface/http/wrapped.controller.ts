import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { WrappedQueryService } from '../../application/wrapped.query.service';
import type { WrappedEnvelopeDto } from './dto/wrapped.dto';

@ApiTags('wrapped')
@Controller('api/v1/wrapped')
export class WrappedController {
  constructor(
    private readonly wrapped: WrappedQueryService,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Get('current')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Fart Wrapped for the current anonymous session' })
  @ApiOkResponse({ description: 'Wrapped envelope; issue null triggers client canonical fallback' })
  async current(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<WrappedEnvelopeDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    return this.wrapped.getCurrentForSession(session.id);
  }

  @Get('by-slug/:slug')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Fart Wrapped for the session that owns a report public slug' })
  @ApiOkResponse({ description: 'Does not increment report view analytics (read-only slug resolve).' })
  async bySlug(
    @Param('slug') slug: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<WrappedEnvelopeDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    return this.wrapped.getForSlug(slug);
  }
}
