import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { GetArtifactUseCase } from '../../application/get-artifact.use-case';
import { GetArtifactContentUseCase } from '../../application/get-artifact-content.use-case';
import { ArtifactResponseDto } from './dto/artifact-response.dto';

@ApiTags('artifacts')
@Controller('api/v1/artifacts')
export class ArtifactsController {
  constructor(
    private readonly getArtifact: GetArtifactUseCase,
    private readonly getArtifactContent: GetArtifactContentUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Get(':artifactId')
  @ApiOperation({ summary: 'Get artifact metadata and retrieval info' })
  @ApiOkResponse({ type: ArtifactResponseDto })
  async findOne(
    @Param('artifactId') artifactId: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<ArtifactResponseDto> {
    const session = await this.resolveSession.execute(
      readSignedSessionCookie(request, this.config.session.cookieName),
    );
    writeSignedSessionCookie(reply, this.config.session.cookieName, session.id, this.config);

    const artifact = await this.getArtifact.execute(artifactId, session.id);
    return ArtifactResponseDto.fromDomain(artifact);
  }

  @Get(':artifactId/content')
  @ApiOperation({ summary: 'Stream artifact content (HTML share card)' })
  @ApiProduces('text/html')
  @ApiOkResponse({ description: 'Artifact file contents' })
  async content(
    @Param('artifactId') artifactId: string,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    const session = await this.resolveSession.execute(
      readSignedSessionCookie(request, this.config.session.cookieName),
    );
    writeSignedSessionCookie(reply, this.config.session.cookieName, session.id, this.config);

    const { body, contentType } = await this.getArtifactContent.execute(artifactId, session.id);
    void reply.header('Content-Type', contentType);
    void reply.send(body);
  }
}
