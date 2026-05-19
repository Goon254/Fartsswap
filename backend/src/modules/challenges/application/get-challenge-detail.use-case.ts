import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ChallengeLink } from '../../../shared/domain/models';
import { ChallengeLinkEntity } from '../infrastructure/persistence/challenge-link.entity';
import {
  ChallengeReportSummary,
  ChallengeReportSummaryService,
} from './challenge-report-summary';

export interface ChallengeDetail extends ChallengeLink {
  challengerReport?: ChallengeReportSummary;
  responseReport?: ChallengeReportSummary;
}

@Injectable()
export class GetChallengeDetailUseCase {
  constructor(
    @InjectRepository(ChallengeLinkEntity) private readonly links: Repository<ChallengeLinkEntity>,
    private readonly summaries: ChallengeReportSummaryService,
  ) {}

  async execute(challengeId: string): Promise<ChallengeDetail> {
    const row = await this.links.findOne({ where: { id: challengeId } });
    if (!row) {
      throw new NotFoundException(`Challenge ${challengeId} not found`);
    }

    const link: ChallengeLink = {
      id: row.id,
      sessionId: row.sessionId,
      reportId: row.reportId,
      responseReportId: row.responseReportId,
      variantId: row.variantId,
      sourceScore: row.sourceScore,
      challengeType: row.challengeType,
      sourceSurface: row.sourceSurface,
      issuedAt: row.issuedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString(),
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    };

    const [challengerReport, responseReport] = await Promise.all([
      this.summaries.summarizeReport(row.reportId),
      this.summaries.summarizeReport(row.responseReportId),
    ]);

    return { ...link, challengerReport, responseReport };
  }
}
