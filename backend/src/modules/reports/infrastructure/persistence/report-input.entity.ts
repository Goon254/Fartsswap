import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('report_inputs')
export class ReportInputEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId!: string;

  @Column({ name: 'audio_upload_id', type: 'uuid', nullable: true })
  audioUploadId?: string;

  @Column({ name: 'custom_fart_name', length: 255, nullable: true })
  customFartName?: string;

  @Column({ name: 'tone_preset', length: 64, nullable: true })
  tonePreset?: string;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs?: number;

  @Column({ length: 32 })
  source!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
