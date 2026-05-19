import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChallengeReportSummary } from '../../../application/challenge-report-summary';

export class ChallengeReportSummaryDto {
  @ApiProperty()
  reportId!: string;

  @ApiProperty()
  fartName!: string;

  @ApiProperty()
  classification!: string;

  @ApiProperty()
  powerScore!: number;

  @ApiProperty()
  threatLevel!: string;

  @ApiProperty()
  probableCause!: string;

  @ApiPropertyOptional()
  emotionalTone?: string;

  @ApiProperty()
  playbackAvailable!: boolean;

  @ApiPropertyOptional()
  audioContentType?: string;

  static fromSummary(summary: ChallengeReportSummary): ChallengeReportSummaryDto {
    const dto = new ChallengeReportSummaryDto();
    Object.assign(dto, summary);
    return dto;
  }
}
