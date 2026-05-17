import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AudioUpload } from '../../../../shared/domain/models';
import { getTransactionalManager } from '../../../../shared/infrastructure/transaction/transaction-context';
import type { AudioUploadRepository } from '../../application/ports/audio-upload.repository';
import { AudioUploadEntity } from './audio-upload.entity';

@Injectable()
export class TypeOrmAudioUploadRepository implements AudioUploadRepository {
  constructor(
    @InjectRepository(AudioUploadEntity)
    private readonly repo: Repository<AudioUploadEntity>,
  ) {}

  private uploadsRepo(): Repository<AudioUploadEntity> {
    const tx = getTransactionalManager();
    return tx ? tx.getRepository(AudioUploadEntity) : this.repo;
  }

  async save(upload: AudioUpload): Promise<void> {
    await this.uploadsRepo().save(this.toEntity(upload));
  }

  async update(upload: AudioUpload): Promise<void> {
    await this.uploadsRepo().save(this.toEntity(upload));
  }

  async findById(id: string): Promise<AudioUpload | null> {
    const row = await this.uploadsRepo().findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  private toEntity(upload: AudioUpload): AudioUploadEntity {
    const entity = new AudioUploadEntity();
    entity.id = upload.id;
    entity.reportId = upload.reportId;
    entity.sessionId = upload.sessionId;
    entity.status = upload.status;
    entity.storageKey = upload.storageKey;
    entity.mimeType = upload.mimeType;
    entity.sizeBytes = upload.sizeBytes;
    entity.durationSeconds = upload.durationSeconds;
    entity.createdAt = new Date(upload.createdAt);
    entity.updatedAt = new Date(upload.updatedAt);
    entity.processedAt = upload.processedAt ? new Date(upload.processedAt) : undefined;
    entity.deletedAt = upload.deletedAt ? new Date(upload.deletedAt) : undefined;
    return entity;
  }

  private parseNumeric(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  private toDomain(entity: AudioUploadEntity): AudioUpload {
    return {
      id: entity.id,
      reportId: entity.reportId,
      sessionId: entity.sessionId,
      status: entity.status as AudioUpload['status'],
      storageKey: entity.storageKey,
      mimeType: entity.mimeType,
      sizeBytes: entity.sizeBytes,
      // pg returns numeric() columns as string at runtime even though the
      // entity is typed `number`; coerce defensively.
      durationSeconds: this.parseNumeric(entity.durationSeconds),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      processedAt: entity.processedAt?.toISOString(),
      deletedAt: entity.deletedAt?.toISOString(),
    };
  }
}
