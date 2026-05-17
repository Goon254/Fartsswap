import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import {
  readSignedSessionCookie,
  writeSignedSessionCookie,
} from '../../../../shared/interface/http/session-cookie';
import { ResolveAnonymousSessionUseCase } from '../../../identity/application/resolve-anonymous-session.use-case';
import { DeleteAudioUploadUseCase } from '../../application/delete-audio-upload.use-case';
import { GetAudioUploadUseCase } from '../../application/get-audio-upload.use-case';
import { UploadAudioUseCase } from '../../application/upload-audio.use-case';
import { AudioUploadResponseDto } from './dto/audio-upload-response.dto';

@ApiTags('audio')
@Controller('api/v1/audio')
export class AudioController {
  constructor(
    private readonly uploadAudio: UploadAudioUseCase,
    private readonly getAudioUpload: GetAudioUploadUseCase,
    private readonly deleteAudioUpload: DeleteAudioUploadUseCase,
    private readonly resolveSession: ResolveAnonymousSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  @Post('uploads')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 12, windowSeconds: 60 })
  @ApiOperation({
    summary: 'Upload a short audio clip (multipart/form-data, field name: file)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        durationSeconds: { type: 'number', description: 'Optional duration hint (max 10)' },
      },
    },
  })
  @ApiCreatedResponse({ type: AudioUploadResponseDto })
  async upload(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AudioUploadResponseDto> {
    const session = await this.resolveSession.execute(
      readSignedSessionCookie(request, this.config.session.cookieName),
    );
    writeSignedSessionCookie(reply, this.config.session.cookieName, session.id, this.config);

    const parsed = await this.parseMultipartUpload(request);

    const upload = await this.uploadAudio.execute({
      sessionId: session.id,
      buffer: parsed.buffer,
      mimeType: parsed.mimeType,
      durationSeconds: parsed.durationSeconds,
      originalFilename: parsed.filename,
    });

    return AudioUploadResponseDto.fromDomain(upload);
  }

  @Get('uploads/:id')
  @ApiOperation({ summary: 'Get audio upload metadata (no raw audio URL)' })
  @ApiOkResponse({ type: AudioUploadResponseDto })
  async getMetadata(
    @Param('id') id: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AudioUploadResponseDto> {
    const session = await this.resolveSession.execute(
      readSignedSessionCookie(request, this.config.session.cookieName),
    );
    writeSignedSessionCookie(reply, this.config.session.cookieName, session.id, this.config);

    const upload = await this.getAudioUpload.execute(id, session.id);
    return AudioUploadResponseDto.fromDomain(upload);
  }

  @Delete('uploads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete raw audio upload (only before report is created)',
  })
  @ApiNoContentResponse()
  async delete(
    @Param('id') id: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const session = await this.resolveSession.execute(
      readSignedSessionCookie(request, this.config.session.cookieName),
    );
    writeSignedSessionCookie(reply, this.config.session.cookieName, session.id, this.config);

    await this.deleteAudioUpload.execute(id, session.id);
  }

  private async parseMultipartUpload(request: FastifyRequest): Promise<{
    buffer: Buffer;
    mimeType: string;
    durationSeconds?: number;
    filename?: string;
  }> {
    let buffer: Buffer | null = null;
    let mimeType = '';
    let filename: string | undefined;
    let durationSeconds: number | undefined;

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const file = part;
        if (file.fieldname === 'file') {
          buffer = await file.toBuffer();
          mimeType = file.mimetype;
          filename = file.filename;
        }
      } else if (part.type === 'field') {
        const field = part;
        if (field.fieldname === 'durationSeconds') {
          const value = String(field.value);
          const parsed = Number(value);
          if (Number.isFinite(parsed)) {
            durationSeconds = parsed;
          }
        }
      }
    }

    if (!buffer || !mimeType) {
      throw new BadRequestException('Multipart field "file" is required');
    }

    return { buffer, mimeType, durationSeconds, filename };
  }
}
