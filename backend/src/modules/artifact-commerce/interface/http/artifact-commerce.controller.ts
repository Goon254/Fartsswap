import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import { Idempotent } from '../../../../shared/interface/http/idempotency.decorator';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { PremiumIntentResponseDto } from '../../../commerce/interface/http/dto/premium-intent-response.dto';
import { ArtifactCommerceIntentService } from '../../application/artifact-commerce-intent.service';
import { CertificatePreviewBodyDto } from './dto/certificate-preview-body.dto';
import { CreateArtifactCommerceIntentBodyDto } from './dto/create-artifact-commerce-intent-body.dto';
import { TransitionArtifactCommerceIntentBodyDto } from './dto/transition-artifact-commerce-intent-body.dto';

@ApiTags('artifact-commerce')
@Controller('api/v1/commerce/artifacts')
export class ArtifactCommerceController {
  constructor(
    private readonly commerce: ArtifactCommerceIntentService,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Get('themes')
  @ApiOperation({ summary: 'List sellable premium artifact themes (catalog + pricing)' })
  @ApiOkResponse({ description: 'Theme catalog entries' })
  async listThemes(): Promise<{ themes: ReturnType<ArtifactCommerceIntentService['listPremiumThemes']> }> {
    return { themes: [...this.commerce.listPremiumThemes()] };
  }

  @Get('themes/:code')
  @ApiOperation({ summary: 'Get a single premium theme by code' })
  @ApiOkResponse({ description: 'Theme catalog entry' })
  async getTheme(@Param('code') code: string) {
    return this.commerce.getPremiumTheme(code);
  }

  @Post('intents')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Create an artifact-commerce intent for a report (session-scoped)' })
  @ApiCreatedResponse({ type: PremiumIntentResponseDto })
  async createIntent(
    @Body() body: CreateArtifactCommerceIntentBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<PremiumIntentResponseDto> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const intent = await this.commerce.createCommerceIntent({
      sessionId: session.id,
      reportId: body.reportId,
      ...(body.sourceSurface !== undefined ? { sourceSurface: body.sourceSurface } : {}),
      ...(body.variantId !== undefined ? { variantId: body.variantId } : {}),
    });
    return PremiumIntentResponseDto.fromDomain(intent);
  }

  @Get('intents/:intentId')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Fetch a commerce intent owned by the current session' })
  @ApiOkResponse({ type: PremiumIntentResponseDto })
  async getIntent(
    @Param('intentId') intentId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<PremiumIntentResponseDto> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const intent = await this.commerce.getIntentForSession(intentId, session.id);
    return PremiumIntentResponseDto.fromDomain(intent);
  }

  @Post('intents/:intentId/transition')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Advance commerce lifecycle (validated transitions)' })
  @ApiOkResponse({ type: PremiumIntentResponseDto })
  async transition(
    @Param('intentId') intentId: string,
    @Body() body: TransitionArtifactCommerceIntentBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<PremiumIntentResponseDto> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const intent = await this.commerce.transitionIntent({
      intentId,
      sessionId: session.id,
      targetState: body.targetState,
      ...(body.commerceThemeCode !== undefined ? { commerceThemeCode: body.commerceThemeCode } : {}),
      ...(body.productSku !== undefined ? { productSku: body.productSku } : {}),
      ...(body.amountCents !== undefined ? { amountCents: body.amountCents } : {}),
    });
    return PremiumIntentResponseDto.fromDomain(intent);
  }

  @Post('intents/:intentId/checkout-prep')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 20, windowSeconds: 60 })
  @ApiOperation({ summary: 'Prepare checkout (Stripe-shaped placeholder; transitions to checkout_started)' })
  @ApiOkResponse({ description: 'Checkout prep payload + intent snapshot' })
  async checkoutPrep(
    @Param('intentId') intentId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    return this.commerce.prepareCheckout({ intentId, sessionId: session.id });
  }

  @Post('intents/:intentId/checkout-complete-stub')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 20, windowSeconds: 60 })
  @ApiOperation({
    summary:
      'Complete checkout stub — transitions checkout_started → checkout_completed → artifact_fulfilled. When POD_FULFILLMENT_ENABLED=true, creates a mock POD order + packaged merch bundle before fulfillment ref is set.',
  })
  @ApiOkResponse({ type: PremiumIntentResponseDto })
  async checkoutCompleteStub(
    @Param('intentId') intentId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<PremiumIntentResponseDto> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const intent = await this.commerce.completeCheckoutStub({ intentId, sessionId: session.id });
    return PremiumIntentResponseDto.fromDomain(intent);
  }

  @Get('intents/:intentId/merch-bundle')
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Merch-ready export bundle for POD / fulfillment prep' })
  @ApiOkResponse({ description: 'MerchReadyBundle v1 JSON' })
  async merchBundle(
    @Param('intentId') intentId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    return this.commerce.getMerchBundle({ intentId, sessionId: session.id });
  }

  @Post('intents/:intentId/certificate-preview')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 10, windowSeconds: 60 })
  @Idempotent({ scope: 'commerce:certificate-preview', includePathParam: 'intentId' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Optional UUID for safe retries while generating the preview PDF.',
  })
  @ApiOperation({ summary: 'Generate a certificate / dossier PDF preview for the intent theme' })
  @ApiOkResponse({ description: 'Artifact id + download path' })
  async certificatePreview(
    @Param('intentId') intentId: string,
    @Body() body: CertificatePreviewBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    return this.commerce.previewCertificate({
      intentId,
      sessionId: session.id,
      certificateKind: body.certificateKind,
    });
  }
}
