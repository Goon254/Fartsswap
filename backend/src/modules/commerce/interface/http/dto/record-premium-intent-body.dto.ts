import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class RecordPremiumIntentBodyDto {
  @ApiProperty({ description: 'Logical intent kind (e.g. premium_cta_clicked, offer_selected)' })
  @IsString()
  @MaxLength(64)
  kind!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  reportId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
