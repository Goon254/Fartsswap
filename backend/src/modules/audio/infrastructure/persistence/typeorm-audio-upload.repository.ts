import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AudioUpload } from '../../../../shared/domain/models';
import type { AudioUploadRepository } from '../../application/ports/audio-upload.repository';
import { AudioUploadEntity } from './audio-upload.entity';

@Injectable()
export class TypeOrmAudioUploadRepository implements AudioUploadRepository {
  constructor(
    @InjectRepository(AudioUploadEntity)
    private readonly repo: Repository<AudioUploadEntity>,
  ) {}

  async save(upload: AudioUpload): Promise<void> {
    await this.repo.save(this.toEntity(upload));
  }

  async update(upload: AudioUpload): Promise<void> {
    await this.repo.save(this.toEntity(upload));
  }

  async findById(id: string): Promise<AudioUpload | null> {
    const row = await this.repo.findOne({ where: { id } });
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

  private toDomain(entity: AudioUploadEntity): AudioUpload {
    return {
      id: entity.id,
      reportId: entity.reportId,
      sessionId: entity.sessionId,
      status: entity.status as AudioUpload['status'],
      storageKey: entity.storageKey,
      mimeType: entity.mimeType,
      sizeBytes: entity.sizeBytes,
      durationSeconds: entity.durationSeconds ? Number(entity.durationSeconds) : undefined,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      processedAt: entity.processedAt?.toISOString(),
      deletedAt: entity.deletedAt?.toISOString(),
    };
  }
}
