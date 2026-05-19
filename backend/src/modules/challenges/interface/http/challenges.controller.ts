import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { GetChallengeAudioContentUseCase } from '../../application/get-challenge-audio-content.use-case';
import { GetChallengeDetailUseCase } from '../../application/get-challenge-detail.use-case';
import { RecordChallengeEventUseCase } from '../../application/record-challenge-event.use-case';
import { RegisterChallengeUseCase } from '../../application/register-challenge.use-case';
import { ResolveChallengeUseCase } from '../../application/resolve-challenge.use-case';
import { ChallengeDetailResponseDto } from './dto/challenge-detail-response.dto';
import { ChallengeResponseDto } from './dto/challenge-response.dto';
import { OpenChallengeBodyDto } from './dto/open-challenge-body.dto';
import { RegisterChallengeBodyDto } from './dto/register-challenge-body.dto';
import { ResolveChallengeBodyDto } from './dto/resolve-challenge-body.dto';

const CHALLENGE_ID_RE = /^ch_[a-zA-Z0-9_-]{1,58}$/;

@ApiTags('challenges')
@Controller('api/v1/challenges')
export class ChallengesController {
  constructor(
    private readonly registerChallenge: RegisterChallengeUseCase,
    private readonly getChallengeDetail: GetChallengeDetailUseCase,
    private readonly getChallengeAudio: GetChallengeAudioContentUseCase,
    private readonly recordEvent: RecordChallengeEventUseCase,
    private readonly resolveChallenge: ResolveChallengeUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Register or refresh a challenge link (idempotent on challenge id)' })
  @ApiCreatedResponse({ type: ChallengeResponseDto })
  async register(
    @Body() body: RegisterChallengeBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ChallengeResponseDto> {
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    const link = await this.registerChallenge.execute({
      id: body.id,
      sessionId: session.id,
      reportId: body.reportId,
      variantId: body.variantId,
      sourceScore: body.sourceScore,
      challengeType: body.challengeType,
      sourceSurface: body.sourceSurface,
      issuedAt: body.issuedAt,
      metadata: body.metadata,
    });
    return ChallengeResponseDto.fromDomain(link);
  }

  @Get(':challengeId/challenger-audio')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Stream challenger specimen audio for a challenge link' })
  async challengerAudio(
    @Param('challengeId') challengeId: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    if (!CHALLENGE_ID_RE.test(challengeId)) {
      throw new BadRequestException('Invalid challenge id');
    }
    const { body, contentType } = await this.getChallengeAudio.execute(challengeId, 'challenger');
    void reply.header('Content-Type', contentType);
    void reply.header('Cache-Control', 'public, max-age=300');
    void reply.send(body);
  }

  @Get(':challengeId/response-audio')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Stream counter-submission audio after challenge is resolved' })
  async responseAudio(
    @Param('challengeId') challengeId: string,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    if (!CHALLENGE_ID_RE.test(challengeId)) {
      throw new BadRequestException('Invalid challenge id');
    }
    const { body, contentType } = await this.getChallengeAudio.execute(challengeId, 'response');
    void reply.header('Content-Type', contentType);
    void reply.header('Cache-Control', 'public, max-age=300');
    void reply.send(body);
  }

  @Get(':challengeId')
  @ApiOperation({ summary: 'Fetch a persisted challenge with dossier summaries' })
  @ApiOkResponse({ type: ChallengeDetailResponseDto })
  async getOne(@Param('challengeId') challengeId: string): Promise<ChallengeDetailResponseDto> {
    if (!CHALLENGE_ID_RE.test(challengeId)) {
      throw new BadRequestException('Invalid challenge id');
    }
    const detail = await this.getChallengeDetail.execute(challengeId);
    return ChallengeDetailResponseDto.fromDetail(detail);
  }

  @Post(':challengeId/open')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ max: 80, windowSeconds: 60 })
  @ApiOperation({ summary: 'Record a challenge open / view server-side' })
  async open(
    @Param('challengeId') challengeId: string,
    @Body() body: OpenChallengeBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    if (!CHALLENGE_ID_RE.test(challengeId)) {
      throw new BadRequestException('Invalid challenge id');
    }
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    await this.recordEvent.execute({
      challengeId,
      sessionId: session.id,
      kind: 'opened',
      payload: body.payload,
    });
  }

  @Post(':challengeId/resolve')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Mark a challenge resolved and append an event' })
  async resolve(
    @Param('challengeId') challengeId: string,
    @Body() body: ResolveChallengeBodyDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    if (!CHALLENGE_ID_RE.test(challengeId)) {
      throw new BadRequestException('Invalid challenge id');
    }
    const cookieName = this.config.session.cookieName;
    const existingSessionId = readSignedSessionCookie(request, cookieName);
    const session = await this.resolveSession.execute(existingSessionId);
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);

    await this.resolveChallenge.execute({
      challengeId,
      sessionId: session.id,
      responseReportId: body.responseReportId,
      payload: body.payload,
    });
  }
}
