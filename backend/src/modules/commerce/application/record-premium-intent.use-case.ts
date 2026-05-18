import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PremiumIntent } from '../../../shared/domain/models';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { PremiumIntentEntity } from '../infrastructure/persistence/premium-intent.entity';

export interface RecordPremiumIntentCommand {
  sessionId?: string;
  reportId?: string;
  kind: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class RecordPremiumIntentUseCase {
  constructor(
    @InjectRepository(PremiumIntentEntity) private readonly intents: Repository<PremiumIntentEntity>,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: RecordPremiumIntentCommand): Promise<PremiumIntent> {
    if (command.reportId) {
      const report = await this.reports.findReportById(command.reportId);
      if (!report) {
        throw new NotFoundException(`Report ${command.reportId} not found`);
      }
      if (report.sessionId && command.sessionId && report.sessionId !== command.sessionId) {
        throw new ForbiddenException('Report does not belong to this session');
      }
    }

    const now = this.clock.now();
    const id = this.ids.generate();
    const entity = new PremiumIntentEntity();
    entity.id = id;
    entity.sessionId = command.sessionId;
    entity.reportId = command.reportId;
    entity.kind = command.kind;
    entity.payload = command.payload;
    entity.createdAt = now;
    await this.intents.save(entity);
    return {
      id,
      sessionId: command.sessionId,
      reportId: command.reportId,
      kind: command.kind,
      payload: command.payload,
      createdAt: now.toISOString(),
    };
  }
}
