import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AudioUpload } from '../../../../../shared/domain/models';

export class AudioUploadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  reportId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  sessionId?: string;

  @ApiProperty({ example: 'uploaded' })
  status!: string;

  @ApiProperty({ example: 'audio/webm' })
  mimeType!: string;

  @ApiProperty({ example: 4096 })
  sizeBytes!: number;

  @ApiPropertyOptional({ example: 2.5 })
  durationSeconds?: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional()
  processedAt?: string;

  static fromDomain(upload: AudioUpload): AudioUploadResponseDto {
    const dto = new AudioUploadResponseDto();
    dto.id = upload.id;
    dto.reportId = upload.reportId;
    dto.sessionId = upload.sessionId;
    dto.status = upload.status;
    dto.mimeType = upload.mimeType;
    dto.sizeBytes = upload.sizeBytes;
    dto.durationSeconds = upload.durationSeconds;
    dto.createdAt = upload.createdAt;
    dto.updatedAt = upload.updatedAt;
    dto.processedAt = upload.processedAt;
    return dto;
  }
}
