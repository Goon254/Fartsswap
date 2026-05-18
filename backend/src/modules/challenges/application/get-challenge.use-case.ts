import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ChallengeLink } from '../../../shared/domain/models';
import { ChallengeLinkEntity } from '../infrastructure/persistence/challenge-link.entity';

@Injectable()
export class GetChallengeUseCase {
  constructor(
    @InjectRepository(ChallengeLinkEntity) private readonly links: Repository<ChallengeLinkEntity>,
  ) {}

  async execute(challengeId: string): Promise<ChallengeLink> {
    const row = await this.links.findOne({ where: { id: challengeId } });
    if (!row) {
      throw new NotFoundException(`Challenge ${challengeId} not found`);
    }
    return {
      id: row.id,
      sessionId: row.sessionId,
      reportId: row.reportId,
      variantId: row.variantId,
      sourceScore: row.sourceScore,
      challengeType: row.challengeType,
      sourceSurface: row.sourceSurface,
      issuedAt: row.issuedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString(),
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
