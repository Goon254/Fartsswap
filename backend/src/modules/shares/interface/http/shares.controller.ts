import { Body, Controller, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { CreateShareLinkUseCase } from '../../application/create-share-link.use-case';
import { CreateShareLinkResponseDto } from './dto/create-share-link-response.dto';
import { CreateShareLinkBodyDto } from './dto/create-share-link-body.dto';

@ApiTags('shares')
@Controller('api/v1/reports')
export class SharesController {
  constructor(
    private readonly createShareLink: CreateShareLinkUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post(':reportId/shares')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Create a durable share link for a report' })
  @ApiCreatedResponse({ type: CreateShareLinkResponseDto })
  async createForReport(
    @Param('reportId') reportId: string,
    @Body() body: CreateShareLinkBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<CreateShareLinkResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    const link = await this.createShareLink.execute({
      reportId,
      sessionId: session.id,
      kind: body.kind,
      metadata: body.metadata,
    });
    return CreateShareLinkResponseDto.fromDomain(link);
  }
}
