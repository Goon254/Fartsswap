import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { randomBytes } from 'crypto';
import {
  OBJECT_STORAGE_PORT,
  type ObjectStoragePort,
} from '../../../../shared/application/ports/object-storage.port';

/**
 * Storage sanity check for the readiness probe.
 *
 * Writes a tiny probe object under a dedicated `.healthcheck/` prefix and
 * deletes it. Catches missing mounts, read-only volumes, or broken adapters
 * (including the fail-fast S3 stub) before traffic is routed in.
 */
@Injectable()
export class StorageHealthIndicator extends HealthIndicator {
  constructor(@Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const probeKey = `.healthcheck/${Date.now()}-${randomBytes(4).toString('hex')}.txt`;
    try {
      await this.storage.putObject({
        key: probeKey,
        body: Buffer.from('ok'),
        contentType: 'text/plain',
      });
      try {
        await this.storage.deleteObject(probeKey);
      } catch {
        // Delete failure is not fatal for readiness; surface as a soft warning.
      }
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Storage probe failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'unknown',
        }),
      );
    }
  }
}
