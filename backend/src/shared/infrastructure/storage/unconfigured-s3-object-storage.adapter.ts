import { Injectable } from '@nestjs/common';
import type { ObjectStoragePort, PutObjectOptions, StoredObject } from '../../application/ports/object-storage.port';
import { AppConfigService } from '../../../config/config.service';

/**
 * Placeholder S3 adapter that exists only to fail fast.
 *
 * A real S3-compatible adapter is not implemented in this build. To avoid the
 * previous footgun of silently returning fake data (which would corrupt
 * artifacts and break audio retrieval), every operation now throws.
 *
 * The application wiring in `SharedModule` additionally refuses to boot when
 * `STORAGE_PROVIDER=s3` is selected, so this class should never be invoked at
 * runtime. It only exists so the DI graph still type-checks if someone
 * accidentally requests it.
 */
@Injectable()
export class UnconfiguredS3ObjectStorageAdapter implements ObjectStoragePort {
  constructor(private readonly config: AppConfigService) {}

  private fail(op: string): never {
    throw new Error(
      `S3 object storage is not implemented in this build (op=${op}, provider=${this.config.storage.provider}). ` +
        'Set STORAGE_PROVIDER=local or ship a real S3 adapter before enabling s3.',
    );
  }

  async putObject(_options: PutObjectOptions): Promise<string> {
    this.fail('putObject');
  }

  async getObject(_key: string): Promise<StoredObject> {
    this.fail('getObject');
  }

  async deleteObject(_key: string): Promise<void> {
    this.fail('deleteObject');
  }

  async getSignedUrl(_key: string, _expiresInSeconds?: number): Promise<string> {
    this.fail('getSignedUrl');
  }
}
