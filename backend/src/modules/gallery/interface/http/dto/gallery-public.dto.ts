import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { GALLERY_USER_REPORT_REASONS } from '../../../domain/moderation-policy';

export class CreateGallerySubmissionDto {
  @ApiProperty()
  @IsUUID('4')
  reportId!: string;

  @ApiPropertyOptional({ description: 'Optional ready artifact (share card, PDF, etc.)' })
  @IsOptional()
  @IsUUID('4')
  reportArtifactId?: string;
}

export class FileGalleryReportDto {
  @ApiProperty()
  @IsUUID('4')
  submissionId!: string;

  @ApiProperty({ enum: [...GALLERY_USER_REPORT_REASONS] })
  @IsString()
  @IsIn([...GALLERY_USER_REPORT_REASONS])
  reasonCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}
