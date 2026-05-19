import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChallengeLink } from '../../../../../shared/domain/models';

export class ChallengeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  sessionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  reportId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  responseReportId?: string;

  @ApiProperty()
  variantId!: string;

  @ApiProperty()
  sourceScore!: number;

  @ApiProperty()
  challengeType!: string;

  @ApiProperty()
  sourceSurface!: string;

  @ApiProperty()
  issuedAt!: string;

  @ApiPropertyOptional()
  resolvedAt?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;

  static fromDomain(link: ChallengeLink): ChallengeResponseDto {
    const dto = new ChallengeResponseDto();
    Object.assign(dto, link);
    return dto;
  }
}
