import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { FartmaximizerApplicationService } from '../../application/fartmaximizer-application.service';
import {
  CastFartmaxVoteDto,
  FartmaximizerLeaderboardDto,
  FartmaximizerLeaderboardQueryDto,
  FartmaxMealDto,
  SubmitFartmaxMealDto,
} from './dto/fartmaximizer-public.dto';

@ApiTags('fartmaximizer')
@Controller('api/v1/fartmaximizer')
export class FartmaximizerPublicController {
  constructor(
    private readonly fartmax: FartmaximizerApplicationService,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Get('leaderboard')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Ranked meal combinations with optional session vote map' })
  @ApiOkResponse({ type: FartmaximizerLeaderboardDto })
  async leaderboard(
    @Query() query: FartmaximizerLeaderboardQueryDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<FartmaximizerLeaderboardDto> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const result = await this.fartmax.getLeaderboard({
      sessionId: session.id,
      limit: query.limit,
    });
    return FartmaximizerLeaderboardDto.fromResult(result);
  }

  @Post('meals')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 12, windowSeconds: 3600 })
  @ApiOperation({ summary: 'Submit a new meal combination for community voting' })
  @ApiCreatedResponse({ type: FartmaxMealDto })
  async submitMeal(
    @Body() body: SubmitFartmaxMealDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<FartmaxMealDto> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const row = await this.fartmax.submitMeal({
      sessionId: session.id,
      name: body.name,
      description: body.description,
    });
    return FartmaxMealDto.fromRow(row);
  }

  @Post('meals/:mealId/vote')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 120, windowSeconds: 3600 })
  @ApiOperation({ summary: 'Cast or change an up/down vote (one vote per session per meal)' })
  @ApiOkResponse({ type: FartmaximizerLeaderboardDto })
  async castVote(
    @Param('mealId', ParseUUIDPipe) mealId: string,
    @Body() body: CastFartmaxVoteDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<FartmaximizerLeaderboardDto> {
    const cookieName = this.config.session.cookieName;
    const session = await this.resolveSession.execute(readSignedSessionCookie(request, cookieName));
    writeSignedSessionCookie(reply, cookieName, session.id, this.config);
    const result = await this.fartmax.castVote({
      sessionId: session.id,
      mealId,
      direction: body.direction,
    });
    return FartmaximizerLeaderboardDto.fromResult(result);
  }
}
