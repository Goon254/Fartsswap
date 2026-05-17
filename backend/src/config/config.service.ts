import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  get nodeEnv(): EnvConfig['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get logLevel(): EnvConfig['LOG_LEVEL'] {
    return this.config.get('LOG_LEVEL', { infer: true });
  }

  get database() {
    return {
      host: this.config.get('DATABASE_HOST', { infer: true }),
      port: this.config.get('DATABASE_PORT', { infer: true }),
      username: this.config.get('DATABASE_USER', { infer: true }),
      password: this.config.get('DATABASE_PASSWORD', { infer: true }),
      database: this.config.get('DATABASE_NAME', { infer: true }),
      ssl: this.config.get('DATABASE_SSL', { infer: true }),
      runMigrations: this.config.get('DATABASE_RUN_MIGRATIONS', { infer: true }),
    };
  }

  get redis() {
    return {
      host: this.config.get('REDIS_HOST', { infer: true }),
      port: this.config.get('REDIS_PORT', { infer: true }),
      password: this.config.get('REDIS_PASSWORD', { infer: true }),
    };
  }

  get storage() {
    return {
      provider: this.config.get('STORAGE_PROVIDER', { infer: true }),
      localPath: this.config.get('STORAGE_LOCAL_PATH', { infer: true }),
      bucket: this.config.get('STORAGE_BUCKET', { infer: true }),
      endpoint: this.config.get('STORAGE_ENDPOINT', { infer: true }),
      region: this.config.get('STORAGE_REGION', { infer: true }),
      accessKey: this.config.get('STORAGE_ACCESS_KEY', { infer: true }),
      secretKey: this.config.get('STORAGE_SECRET_KEY', { infer: true }),
    };
  }

  get queueProvider(): EnvConfig['QUEUE_PROVIDER'] {
    return this.config.get('QUEUE_PROVIDER', { infer: true });
  }

  get aiProvider(): EnvConfig['AI_PROVIDER'] {
    return this.config.get('AI_PROVIDER', { infer: true });
  }

  get session() {
    return {
      cookieName: this.config.get('SESSION_COOKIE_NAME', { infer: true }),
      ttlSeconds: this.config.get('SESSION_TTL_SECONDS', { infer: true }),
    };
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get audioUpload() {
    const mimeTypes = this.config
      .get('AUDIO_UPLOAD_ALLOWED_MIME_TYPES', { infer: true })
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      maxBytes: this.config.get('AUDIO_UPLOAD_MAX_BYTES', { infer: true }),
      allowedMimeTypes: mimeTypes,
      storagePrefix: this.config.get('AUDIO_UPLOAD_STORAGE_PREFIX', { infer: true }),
    };
  }
}
