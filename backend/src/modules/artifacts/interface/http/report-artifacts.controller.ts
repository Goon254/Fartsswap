import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res } from '@nestjs/common';
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
import { GeneratePdfReportArtifactUseCase } from '../../application/generate-pdf-report-artifact.use-case';
import { GenerateShareCardArtifactUseCase } from '../../application/generate-share-card-artifact.use-case';
import { ListReportArtifactsUseCase } from '../../application/list-report-artifacts.use-case';
import { ArtifactResponseDto } from './dto/artifact-response.dto';
import { GeneratePdfReportDto } from './dto/generate-pdf-report.dto';
import { GenerateShareCardDto } from './dto/generate-share-card.dto';

@ApiTags('report-artifacts')
@Controller('api/v1/reports/:reportId/artifacts')
export class ReportArtifactsController {
  constructor(
    private readonly generateShareCard: GenerateShareCardArtifactUseCase,
    private readonly generatePdfReport: GeneratePdfReportArtifactUseCase,
    private readonly listArtifacts: ListReportArtifactsUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post('share-card')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 20, windowSeconds: 60 })
  @Idempotent({ scope: 'artifacts:share-card', includePathParam: 'reportId' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Optional UUID. Replays the same response within the TTL window.',
  })
  @ApiOperation({ summary: 'Generate a share-card artifact for a report' })
  @ApiCreatedResponse({ type: ArtifactResponseDto })
  async createShareCard(
    @Param('reportId') reportId: string,
    @Body() body: GenerateShareCardDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ArtifactResponseDto> {
    const session = await this.resolveSession.execute(
      readSignedSessionCookie(request, this.config.session.cookieName),
    );
    writeSignedSessionCookie(reply, this.config.session.cookieName, session.id, this.config);

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

  @Post('pdf')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 10, windowSeconds: 60 })
  @Idempotent({ scope: 'artifacts:pdf', includePathParam: 'reportId' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Optional UUID. Replays the same response within the TTL window. ' +
      'Independently, repeated calls for the same (reportId, themeCode) return the existing PDF artifact.',
  })
  @ApiOperation({ summary: 'Generate a PDF diagnostic dossier for a report' })
  @ApiCreatedResponse({ type: ArtifactResponseDto })
  async createPdf(
    @Param('reportId') reportId: string,
    @Body() body: GeneratePdfReportDto,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ArtifactResponseDto> {
    const session = await this.resolveSession.execute(
      readSignedSessionCookie(request, this.config.session.cookieName),
    );
    writeSignedSessionCookie(reply, this.config.session.cookieName, session.id, this.config);

    const artifact = await this.generatePdfReport.execute({
      reportId,
      sessionId: session.id,
      ...(body.themeCode !== undefined ? { themeCode: body.themeCode } : {}),
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
      readSignedSessionCookie(request, this.config.session.cookieName),
    );
    writeSignedSessionCookie(reply, this.config.session.cookieName, session.id, this.config);

    const artifacts = await this.listArtifacts.execute(reportId);
    return artifacts.map((artifact) =>
      ArtifactResponseDto.fromDomain({
        ...artifact,
        contentUrl: `/api/v1/artifacts/${artifact.id}/content`,
      }),
    );
  }
}
