import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PremiumIntent } from '../../../../../shared/domain/models';

export class PremiumIntentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  sessionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  reportId?: string;

  @ApiProperty()
  kind!: string;

  @ApiPropertyOptional()
  payload?: Record<string, unknown>;

  @ApiProperty()
  createdAt!: string;

  static fromDomain(intent: PremiumIntent): PremiumIntentResponseDto {
    const dto = new PremiumIntentResponseDto();
    Object.assign(dto, intent);
    return dto;
  }
}
