import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReportSource } from '../../../shared/domain/types';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ChallengeLinkEntity } from '../infrastructure/persistence/challenge-link.entity';
import { RecordChallengeEventUseCase } from './record-challenge-event.use-case';

export interface ResolveChallengeCommand {
  challengeId: string;
  sessionId?: string;
  responseReportId?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class ResolveChallengeUseCase {
  constructor(
    @InjectRepository(ChallengeLinkEntity) private readonly links: Repository<ChallengeLinkEntity>,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    private readonly recordEvent: RecordChallengeEventUseCase,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: ResolveChallengeCommand): Promise<void> {
    const link = await this.links.findOne({ where: { id: command.challengeId } });
    if (!link) {
      throw new NotFoundException(`Challenge ${command.challengeId} not found`);
    }
    const responseReportId = command.responseReportId?.trim();
    if (responseReportId) {
      const report = await this.reports.findReportById(responseReportId);
      if (!report) {
        throw new NotFoundException(`Response report ${responseReportId} not found`);
      }
      if (report.source !== ReportSource.AUDIO_RECORDING) {
        throw new BadRequestException('response must be a real audio specimen report');
      }
    }

    const now = this.clock.now();
    await this.links.update(
      { id: command.challengeId },
      {
        resolvedAt: now,
        ...(responseReportId ? { responseReportId } : {}),
      },
    );
    await this.recordEvent.execute({
      challengeId: command.challengeId,
      sessionId: command.sessionId,
      kind: 'resolved',
      payload: {
        ...command.payload,
        ...(responseReportId ? { responseReportId } : {}),
      },
    });
  }
}
