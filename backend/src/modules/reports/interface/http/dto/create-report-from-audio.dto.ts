import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReportFromAudioDto {
  @ApiProperty({ format: 'uuid', description: 'Audio upload ID from POST /api/v1/audio/uploads' })
  @IsUUID()
  audioUploadId!: string;

  @ApiPropertyOptional({ example: 'The Midnight Bean' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customFartName?: string;

  @ApiPropertyOptional({ example: 'clinical' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  tonePreset?: string;
}
