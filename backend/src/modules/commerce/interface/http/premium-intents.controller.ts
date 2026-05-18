import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { RecordPremiumIntentUseCase } from '../../application/record-premium-intent.use-case';
import { PremiumIntentResponseDto } from './dto/premium-intent-response.dto';
import { RecordPremiumIntentBodyDto } from './dto/record-premium-intent-body.dto';

@ApiTags('premium')
@Controller('api/v1/premium')
export class PremiumIntentsController {
  constructor(
    private readonly recordIntent: RecordPremiumIntentUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post('intents')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Record a premium funnel intent (CTA, offer selection, etc.)' })
  @ApiCreatedResponse({ type: PremiumIntentResponseDto })
  async createIntent(
    @Body() body: RecordPremiumIntentBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<PremiumIntentResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    const intent = await this.recordIntent.execute({
      sessionId: session.id,
      reportId: body.reportId,
      kind: body.kind,
      payload: body.payload,
      ...(body.lifecycleState !== undefined ? { lifecycleState: body.lifecycleState } : {}),
      ...(body.commerceThemeCode !== undefined ? { commerceThemeCode: body.commerceThemeCode } : {}),
      ...(body.productSku !== undefined ? { productSku: body.productSku } : {}),
      ...(body.amountCents !== undefined ? { amountCents: body.amountCents } : {}),
      ...(body.currency !== undefined ? { currency: body.currency } : {}),
    });
    return PremiumIntentResponseDto.fromDomain(intent);
  }
}
