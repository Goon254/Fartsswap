import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ChallengeLink } from '../../../shared/domain/models';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { ChallengeLinkEntity } from '../infrastructure/persistence/challenge-link.entity';

export interface RegisterChallengeCommand {
  id: string;
  sessionId?: string;
  reportId?: string;
  variantId: string;
  sourceScore: number;
  challengeType: string;
  sourceSurface: string;
  issuedAt: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class RegisterChallengeUseCase {
  constructor(
    @InjectRepository(ChallengeLinkEntity) private readonly links: Repository<ChallengeLinkEntity>,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: RegisterChallengeCommand): Promise<ChallengeLink> {
    if (command.reportId) {
      const report = await this.reports.findReportById(command.reportId);
      if (!report) {
        throw new NotFoundException(`Report ${command.reportId} not found`);
      }
      if (report.sessionId && command.sessionId && report.sessionId !== command.sessionId) {
        throw new ForbiddenException('Report does not belong to this session');
      }
    }

    const issuedAt = new Date(command.issuedAt);
    if (Number.isNaN(issuedAt.getTime())) {
      throw new BadRequestException('Invalid issuedAt');
    }

    const existing = await this.links.findOne({ where: { id: command.id } });
    const now = this.clock.now();
    if (existing) {
      return this.toDomain(existing);
    }

    const entity = new ChallengeLinkEntity();
    entity.id = command.id;
    entity.sessionId = command.sessionId;
    entity.reportId = command.reportId;
    entity.variantId = command.variantId;
    entity.sourceScore = command.sourceScore;
    entity.challengeType = command.challengeType;
    entity.sourceSurface = command.sourceSurface;
    entity.issuedAt = issuedAt;
    entity.metadata = command.metadata;
    entity.createdAt = now;
    await this.links.save(entity);
    return this.toDomain(entity);
  }

  private toDomain(entity: ChallengeLinkEntity): ChallengeLink {
    return {
      id: entity.id,
      sessionId: entity.sessionId,
      reportId: entity.reportId,
      variantId: entity.variantId,
      sourceScore: entity.sourceScore,
      challengeType: entity.challengeType,
      sourceSurface: entity.sourceSurface,
      issuedAt: entity.issuedAt.toISOString(),
      resolvedAt: entity.resolvedAt?.toISOString(),
      metadata: entity.metadata,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
