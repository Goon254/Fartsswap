import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ReportArtifact } from '../../../../shared/domain/models';
import type { ArtifactType } from '../../../../shared/domain/types';
import type { ReportArtifactRepository } from '../../application/ports/report-artifact.repository';
import { ReportArtifactEntity } from './report-artifact.entity';

@Injectable()
export class TypeOrmReportArtifactRepository implements ReportArtifactRepository {
  constructor(
    @InjectRepository(ReportArtifactEntity)
    private readonly repo: Repository<ReportArtifactEntity>,
  ) {}

  async save(artifact: ReportArtifact): Promise<void> {
    await this.repo.save(this.toEntity(artifact));
  }

  async update(artifact: ReportArtifact): Promise<void> {
    await this.repo.save(this.toEntity(artifact));
  }

  async findById(id: string): Promise<ReportArtifact | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByReportId(reportId: string, type?: ArtifactType): Promise<ReportArtifact[]> {
    const rows = await this.repo.find({
      where: type ? { reportId, type } : { reportId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  private toEntity(artifact: ReportArtifact): ReportArtifactEntity {
    const entity = new ReportArtifactEntity();
    entity.id = artifact.id;
    entity.reportId = artifact.reportId;
    entity.type = artifact.type;
    entity.status = artifact.status;
    entity.storageKey = artifact.storageKey;
    entity.mimeType = artifact.mimeType;
    entity.styleVariant = artifact.styleVariant;
    entity.failureReason = artifact.failureReason;
    entity.createdAt = new Date(artifact.createdAt);
    entity.updatedAt = new Date(artifact.updatedAt);
    entity.completedAt = artifact.completedAt ? new Date(artifact.completedAt) : undefined;
    entity.failedAt = artifact.failedAt ? new Date(artifact.failedAt) : undefined;
    return entity;
  }

  private toDomain(entity: ReportArtifactEntity): ReportArtifact {
    return {
      id: entity.id,
      reportId: entity.reportId,
      type: entity.type as ReportArtifact['type'],
      status: entity.status as ReportArtifact['status'],
      storageKey: entity.storageKey,
      mimeType: entity.mimeType,
      styleVariant: entity.styleVariant,
      failureReason: entity.failureReason,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      completedAt: entity.completedAt?.toISOString(),
      failedAt: entity.failedAt?.toISOString(),
    };
  }
}
