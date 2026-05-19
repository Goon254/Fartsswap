import { ApiPropertyOptional } from '@nestjs/swagger';
import type { ChallengeDetail } from '../../../application/get-challenge-detail.use-case';
import { ChallengeReportSummaryDto } from './challenge-report-summary.dto';
import { ChallengeResponseDto } from './challenge-response.dto';

export class ChallengeDetailResponseDto extends ChallengeResponseDto {
  @ApiPropertyOptional({ type: ChallengeReportSummaryDto })
  challengerReport?: ChallengeReportSummaryDto;

  @ApiPropertyOptional({ type: ChallengeReportSummaryDto })
  responseReport?: ChallengeReportSummaryDto;

  static fromDetail(detail: ChallengeDetail): ChallengeDetailResponseDto {
    const dto = new ChallengeDetailResponseDto();
    Object.assign(dto, detail);
    if (detail.challengerReport) {
      dto.challengerReport = ChallengeReportSummaryDto.fromSummary(detail.challengerReport);
    }
    if (detail.responseReport) {
      dto.responseReport = ChallengeReportSummaryDto.fromSummary(detail.responseReport);
    }
    return dto;
  }
}
