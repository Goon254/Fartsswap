import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('audio_uploads')
export class AudioUploadEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId?: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ length: 32 })
  status!: string;

  @Column({ name: 'storage_key', length: 512 })
  storageKey!: string;

  @Column({ name: 'mime_type', length: 128 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number;

  @Column({ name: 'duration_seconds', type: 'numeric', precision: 6, scale: 2, nullable: true })
  durationSeconds?: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
