import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateFakeReportDto {
  @ApiPropertyOptional({ example: 'The Midnight Bean' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customFartName?: string;

  @ApiPropertyOptional({ example: 'clinical', enum: ['clinical', 'dramatic', 'wholesome'] })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tonePreset?: string;
}
