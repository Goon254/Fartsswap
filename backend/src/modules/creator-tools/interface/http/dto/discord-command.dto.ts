import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class DiscordContextFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  guildId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  channelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(256)
  invokerLabel?: string;
}

export class DiscordClassifyBodyDto extends DiscordContextFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customFartName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tonePreset?: string;

  @ApiPropertyOptional({ description: 'Batch dossier minting (1 = single, default). Gated when CREATOR_ENTITLEMENT_ENFORCEMENT=true.', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  batchSize?: number;

  @ApiPropertyOptional({ description: 'Session to meter batch_generation against (required for batch > 1 when enforcement is on).' })
  @IsOptional()
  @IsUUID('4')
  holderSessionId?: string;
}

export class DiscordChallengeBodyDto extends DiscordContextFieldsDto {
  @ApiPropertyOptional({ description: 'If omitted, a new id is minted.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  challengeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  reportId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  variantId!: string;

  @ApiPropertyOptional({ default: 72 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  sourceScore?: number;

  @ApiPropertyOptional({ default: 'community_dispute' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  challengeType?: string;

  @ApiPropertyOptional({ default: 'discord' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  sourceSurface?: string;
}

export class DiscordBadgeBodyDto extends DiscordContextFieldsDto {
  @ApiProperty({ enum: ['honorary_filer', 'dispute_champion', 'bulletin_clerk'] })
  @IsIn(['honorary_filer', 'dispute_champion', 'bulletin_clerk'])
  templateId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  variantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  honoreeLine?: string;
}

export class DiscordWrappedBodyDto extends DiscordContextFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  slug?: string;
}

export class DiscordShareBodyDto extends DiscordContextFieldsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  reportId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;
}
