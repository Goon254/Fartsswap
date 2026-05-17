import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Not, Repository } from 'typeorm';
import { AppConfigService } from '../../../config/config.service';
import { MetricsService } from '../../../observability/metrics.service';
import { captureException } from '../../../observability/sentry';
import {
  OBJECT_STORAGE_PORT,
  type ObjectStoragePort,
} from '../../../shared/application/ports/object-storage.port';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { AudioStatus } from '../../../shared/domain/types';
import { AudioUploadEntity } from '../infrastructure/persistence/audio-upload.entity';

/**
 * Background sweeper that deletes raw audio after the configured retention
 * window, regardless of whether AUDIO_AUTO_DELETE_AFTER_PROCESSING ran
 * post-commit successfully. Provides a privacy guarantee: nothing older
 * than AUDIO_RETENTION_MAX_AGE_HOURS lives in storage, period.
 *
 * Enabled when:
 *  - AUDIO_RETENTION_MAX_AGE_HOURS > 0
 *  - APP_ROLE includes the worker role (so we only sweep from worker procs)
 *
 * Storage delete failures are logged + reported but do not block subsequent
 * rows; the next sweep will retry them.
 */
@Injectable()
export class AudioRetentionService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AudioRetentionService.name);
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  private shuttingDown = false;

  constructor(
    @InjectRepository(AudioUploadEntity)
    private readonly repo: Repository<AudioUploadEntity>,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly config: AppConfigService,
    private readonly metrics: MetricsService,
  ) {}

  onModuleInit(): void {
    if (!this.config.runsWorker) {
      this.logger.log('audio retention disabled (APP_ROLE != worker|all)');
      return;
    }
    if (this.config.audioRetention.maxAgeHours <= 0) {
      this.logger.log('audio retention disabled (AUDIO_RETENTION_MAX_AGE_HOURS=0)');
      return;
    }
    this.scheduleNext(5_000);
  }

  async onApplicationShutdown(): Promise<void> {
    this.shuttingDown = true;
    if (this.timer) clearTimeout(this.timer);
    const deadline = Date.now() + 2_000;
    while (this.running && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  private scheduleNext(delayMs: number): void {
    if (this.shuttingDown) return;
    this.timer = setTimeout(() => {
      void this.sweep().finally(() =>
        { this.scheduleNext(this.config.audioRetention.sweepIntervalMs); },
      );
    }, delayMs);
    this.timer.unref?.();
  }

  private async sweep(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const cutoff = new Date(
        this.clock.now().getTime() - this.config.audioRetention.maxAgeHours * 3600 * 1000,
      );
      const rows = await this.repo.find({
        where: {
          createdAt: LessThan(cutoff),
          status: Not(AudioStatus.DELETED),
          deletedAt: IsNull(),
        },
        take: 100,
      });
      if (rows.length === 0) return;

      for (const row of rows) {
        try {
          await this.storage.deleteObject(row.storageKey);
        } catch (error) {
          this.logger.warn(
            { err: error, audioUploadId: row.id, storageKey: row.storageKey },
            'audio retention storage delete failed',
          );
          captureException(error, { audioUploadId: row.id });
          continue;
        }
        const deletedAt = this.clock.now();
        await this.repo.update(
          { id: row.id },
          { status: AudioStatus.DELETED, deletedAt, updatedAt: deletedAt },
        );
        this.metrics.audioRetentionDeletedTotal.inc();
      }
    } catch (error) {
      this.logger.error({ err: error }, 'audio retention sweep failed');
      captureException(error);
    } finally {
      this.running = false;
    }
  }
}
