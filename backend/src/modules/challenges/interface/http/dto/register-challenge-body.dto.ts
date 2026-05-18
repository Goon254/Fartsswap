import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsObject, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';

const CHALLENGE_TYPES = ['beat_score', 'rarer_classification', 'open'] as const;
const SURFACES = ['report', 'share'] as const;

export class RegisterChallengeBodyDto {
  @ApiProperty({ example: 'ch_a1b2c3d4e5f6' })
  @IsString()
  @Matches(/^ch_[a-zA-Z0-9_-]{1,58}$/)
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  reportId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  variantId!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  sourceScore!: number;

  @ApiProperty({ enum: CHALLENGE_TYPES })
  @IsString()
  @IsIn([...CHALLENGE_TYPES])
  challengeType!: string;

  @ApiProperty({ enum: SURFACES })
  @IsString()
  @IsIn([...SURFACES])
  sourceSurface!: string;

  @ApiProperty({ description: 'ISO-8601 timestamp from the client packet' })
  @IsString()
  issuedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
