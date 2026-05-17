import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ReportArtifact } from '../../../../../shared/domain/models';
import type { ArtifactWithRetrieval } from '../../../application/get-artifact.use-case';

export class ArtifactResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  reportId!: string;

  @ApiProperty({ example: 'share_card' })
  type!: string;

  @ApiProperty({ example: 'ready' })
  status!: string;

  @ApiPropertyOptional()
  storageKey?: string;

  @ApiPropertyOptional({ example: 'text/html; charset=utf-8' })
  mimeType?: string;

  @ApiPropertyOptional({ example: 'clinical' })
  styleVariant?: string;

  @ApiPropertyOptional()
  failureReason?: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional()
  completedAt?: string;

  @ApiPropertyOptional()
  failedAt?: string;

  @ApiPropertyOptional({ description: 'Local file:// or signed URL when artifact is ready' })
  retrievalUrl?: string;

  @ApiPropertyOptional({ description: 'API path to stream artifact content' })
  contentUrl?: string;

  static fromDomain(artifact: ReportArtifact | ArtifactWithRetrieval): ArtifactResponseDto {
    const dto = new ArtifactResponseDto();
    Object.assign(dto, artifact);
    return dto;
  }
}
