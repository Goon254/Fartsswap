import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const MODERATE_ACTIONS = [
  'approve',
  'reject',
  'publish',
  'remove',
  'feature',
  'unfeature',
  'hide',
  'unhide',
  'clear_reports',
] as const;

export type GalleryModerateActionDto = (typeof MODERATE_ACTIONS)[number];

export class GalleryModerateBodyDto {
  @ApiProperty({ enum: MODERATE_ACTIONS })
  @IsIn(MODERATE_ACTIONS)
  action!: GalleryModerateActionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  reasonCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Required when action is feature' })
  @ValidateIf((o: GalleryModerateBodyDto) => o.action === 'feature')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  featuredRank?: number;
}

export class GallerySessionBlockBodyDto {
  @ApiProperty()
  @IsUUID('4')
  sessionId!: string;

  @ApiProperty({ enum: ['gallery_submit', 'gallery_report'] })
  @IsIn(['gallery_submit', 'gallery_report'])
  restrictionKind!: 'gallery_submit' | 'gallery_report';

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  reasonCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'ISO-8601 instant; omit for indefinite' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}
