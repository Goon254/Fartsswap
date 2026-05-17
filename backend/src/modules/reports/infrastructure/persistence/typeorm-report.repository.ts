import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Report, ReportInput } from '../../../../shared/domain/models';
import { getTransactionalManager } from '../../../../shared/infrastructure/transaction/transaction-context';
import type { ReportRepository } from '../../application/ports/report.repository';
import { ReportEntity } from './report.entity';
import { ReportInputEntity } from './report-input.entity';

@Injectable()
export class TypeOrmReportRepository implements ReportRepository {
  constructor(
    @InjectRepository(ReportEntity) private readonly reports: Repository<ReportEntity>,
    @InjectRepository(ReportInputEntity) private readonly inputs: Repository<ReportInputEntity>,
  ) {}

  private reportsRepo(): Repository<ReportEntity> {
    const tx = getTransactionalManager();
    return tx ? tx.getRepository(ReportEntity) : this.reports;
  }

  private inputsRepo(): Repository<ReportInputEntity> {
    const tx = getTransactionalManager();
    return tx ? tx.getRepository(ReportInputEntity) : this.inputs;
  }

  async saveReport(report: Report): Promise<void> {
    await this.reportsRepo().save(this.reportToEntity(report));
  }

  async saveReportInput(input: ReportInput): Promise<void> {
    await this.inputsRepo().save(this.inputToEntity(input));
  }

  async findReportById(id: string): Promise<Report | null> {
    const row = await this.reportsRepo().findOne({ where: { id } });
    return row ? this.reportToDomain(row) : null;
  }

  private reportToEntity(report: Report): ReportEntity {
    const entity = new ReportEntity();
    entity.id = report.id;
    entity.sessionId = report.sessionId;
    entity.status = report.status;
    entity.source = report.source;
    entity.fartName = report.fartName;
    entity.classification = report.classification;
    entity.powerScore = report.powerScore;
    entity.durationMs = report.durationMs;
    entity.emotionalTone = report.emotionalTone;
    entity.probableCause = report.probableCause;
    entity.cinematicParallel = report.cinematicParallel;
    entity.threatLevel = report.threatLevel;
    entity.fartHash = report.fartHash;
    entity.createdAt = new Date(report.createdAt);
    entity.updatedAt = new Date(report.updatedAt);
    entity.completedAt = report.completedAt ? new Date(report.completedAt) : undefined;
    return entity;
  }

  private inputToEntity(input: ReportInput): ReportInputEntity {
    const entity = new ReportInputEntity();
    entity.id = input.id;
    entity.reportId = input.reportId;
    entity.audioUploadId = input.audioUploadId;
    entity.customFartName = input.customFartName;
    entity.tonePreset = input.tonePreset;
    entity.durationMs = input.durationMs;
    entity.source = input.source;
    entity.createdAt = new Date(input.createdAt);
    return entity;
  }

  private reportToDomain(entity: ReportEntity): Report {
    return {
      id: entity.id,
      sessionId: entity.sessionId,
      status: entity.status as Report['status'],
      source: entity.source as Report['source'],
      fartName: entity.fartName,
      classification: entity.classification,
      powerScore: entity.powerScore,
      durationMs: entity.durationMs,
      emotionalTone: entity.emotionalTone,
      probableCause: entity.probableCause,
      cinematicParallel: entity.cinematicParallel,
      threatLevel: entity.threatLevel,
      fartHash: entity.fartHash,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      completedAt: entity.completedAt?.toISOString(),
    };
  }
}
