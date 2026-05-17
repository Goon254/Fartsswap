import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'idempotency_keys' })
@Index('idx_idempotency_expires_at', ['expiresAt'])
export class IdempotencyKeyEntity {
  /** SHA-256 hex of (scope|client_key|session_id|path_param). 64 chars. */
  @PrimaryColumn({ name: 'storage_key', type: 'varchar', length: 64 })
  storageKey!: string;

  @Column({ name: 'scope', type: 'varchar', length: 64 })
  scope!: string;

  @Column({ name: 'client_key', type: 'varchar', length: 200 })
  clientKey!: string;

  @Column({ name: 'session_id', type: 'varchar', length: 64, nullable: true })
  sessionId?: string;

  @Column({ name: 'request_hash', type: 'varchar', length: 64 })
  requestHash!: string;

  @Column({ name: 'response_status', type: 'int' })
  responseStatus!: number;

  @Column({ name: 'response_body', type: 'jsonb' })
  responseBody!: unknown;

  @Column({ name: 'response_headers', type: 'jsonb', nullable: true })
  responseHeaders?: Record<string, string>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;
}
