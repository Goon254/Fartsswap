import { Injectable, Logger } from '@nestjs/common';
import type { ObjectStoragePort, PutObjectOptions } from '../../application/ports/object-storage.port';

/**
 * S3-compatible stub for Phase 1 — logs operations without external calls.
 * Replace with AWS SDK adapter when wiring production storage.
 */
@Injectable()
export class StubS3ObjectStorageAdapter implements ObjectStoragePort {
  private readonly logger = new Logger(StubS3ObjectStorageAdapter.name);

  async putObject(options: PutObjectOptions): Promise<string> {
    this.logger.debug({ key: options.key, contentType: options.contentType }, 'Stub S3 putObject');
    return options.key;
  }

  async getObject(key: string): Promise<{ body: Buffer; contentType?: string }> {
    this.logger.debug({ key }, 'Stub S3 getObject');
    return {
      body: Buffer.from(JSON.stringify({ stub: true, key })),
      contentType: 'application/json',
    };
  }

  async deleteObject(key: string): Promise<void> {
    this.logger.debug({ key }, 'Stub S3 deleteObject');
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return `https://storage.stub.local/${key}?expires=${expiresInSeconds}`;
  }
}
