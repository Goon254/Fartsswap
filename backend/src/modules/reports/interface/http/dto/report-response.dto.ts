import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Report } from '../../../../../shared/domain/models';

export class ReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  sessionId?: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  fartName!: string;

  @ApiProperty()
  classification!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  powerScore!: number;

  @ApiProperty()
  durationMs!: number;

  @ApiProperty()
  emotionalTone!: string;

  @ApiProperty()
  probableCause!: string;

  @ApiProperty()
  cinematicParallel!: string;

  @ApiProperty()
  threatLevel!: string;

  @ApiProperty()
  fartHash!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ description: 'Short public slug for share URLs' })
  publicSlug?: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiPropertyOptional()
  completedAt?: string;

  @ApiPropertyOptional({
    description: 'True when this session may replay the original upload via GET /reports/:id/audio',
  })
  playbackAvailable?: boolean;

  @ApiPropertyOptional({ description: 'MIME type for private playback when available' })
  audioContentType?: string;

  static fromDomain(
    report: Report,
    extras?: Pick<ReportResponseDto, 'playbackAvailable' | 'audioContentType'>,
  ): ReportResponseDto {
    const dto = new ReportResponseDto();
    Object.assign(dto, report, extras);
    return dto;
  }
}
