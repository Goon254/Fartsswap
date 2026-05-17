import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { GenerateShareCardArtifactUseCase } from '../../application/generate-share-card-artifact.use-case';
import { ListReportArtifactsUseCase } from '../../application/list-report-artifacts.use-case';
import { ArtifactResponseDto } from './dto/artifact-response.dto';
import { GenerateShareCardDto } from './dto/generate-share-card.dto';

@ApiTags('report-artifacts')
@Controller('api/v1/reports/:reportId/artifacts')
export class ReportArtifactsController {
  constructor(
    private readonly generateShareCard: GenerateShareCardArtifactUseCase,
    private readonly listArtifacts: ListReportArtifactsUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post('share-card')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a share-card artifact for a report' })
  @ApiCreatedResponse({ type: ArtifactResponseDto })
  async createShareCard(
    @Param('reportId') reportId: string,
    @Body() body: GenerateShareCardDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ArtifactResponseDto> {
    const session = await this.resolveSession.execute(
      this.readSessionCookie(request, this.config.session.cookieName),
    );
    this.setSessionCookie(reply, this.config.session.cookieName, session.id);

    const artifact = await this.generateShareCard.execute({
      reportId,
      sessionId: session.id,
      styleVariant: body.styleVariant,
    });

    return ArtifactResponseDto.fromDomain({
      ...artifact,
      contentUrl: `/api/v1/artifacts/${artifact.id}/content`,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List artifacts for a report' })
  @ApiOkResponse({ type: ArtifactResponseDto, isArray: true })
  async list(
    @Param('reportId') reportId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ArtifactResponseDto[]> {
    const session = await this.resolveSession.execute(
      this.readSessionCookie(request, this.config.session.cookieName),
    );
    this.setSessionCookie(reply, this.config.session.cookieName, session.id);

    const artifacts = await this.listArtifacts.execute(reportId);
    return artifacts.map((artifact) =>
      ArtifactResponseDto.fromDomain({
        ...artifact,
        contentUrl: `/api/v1/artifacts/${artifact.id}/content`,
      }),
    );
  }

  private readSessionCookie(request: FastifyRequest, cookieName: string): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[cookieName];
  }

  private setSessionCookie(reply: FastifyReply, cookieName: string, sessionId: string): void {
    void reply.setCookie(cookieName, sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: this.config.session.ttlSeconds,
      secure: this.config.isProduction,
    });
  }
}
