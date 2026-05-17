import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../../../config/config.service';
import type {
  ObjectStoragePort,
  PutObjectOptions,
  StoredObject,
} from '../../application/ports/object-storage.port';
import { resolveStorageKey } from './storage-key';

/**
 * Real S3-compatible object storage adapter.
 *
 * Works against:
 *  - AWS S3 (default; just bucket + region)
 *  - S3-compatible endpoints (MinIO, R2, Wasabi, DigitalOcean Spaces) via
 *    STORAGE_ENDPOINT.
 *
 * Auth resolution order: explicit STORAGE_ACCESS_KEY/STORAGE_SECRET_KEY, then
 * the AWS SDK default credential chain (env, shared config, IAM instance
 * profile, IRSA on EKS, etc.).
 *
 * Keys are still passed through `resolveStorageKey` so a path-traversal in
 * one storage backend is impossible in any other.
 */
@Injectable()
export class S3ObjectStorageAdapter implements ObjectStoragePort {
  private readonly logger = new Logger(S3ObjectStorageAdapter.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: AppConfigService) {
    const s = this.config.storage;
    this.bucket = s.bucket;

    const clientConfig: S3ClientConfig = {
      region: s.region,
    };
    if (s.endpoint) {
      clientConfig.endpoint = s.endpoint;
      clientConfig.forcePathStyle = true;
    }
    if (s.accessKey && s.secretKey) {
      clientConfig.credentials = {
        accessKeyId: s.accessKey,
        secretAccessKey: s.secretKey,
      };
    }
    this.client = new S3Client(clientConfig);
  }

  async putObject(options: PutObjectOptions): Promise<string> {
    const key = this.normalize(options.key);
    const body = typeof options.body === 'string' ? Buffer.from(options.body) : options.body;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: options.contentType,
        }),
      );
      return options.key;
    } catch (error) {
      this.logger.error({ err: error, key, op: 'putObject' }, 's3 putObject failed');
      throw error;
    }
  }

  async getObject(key: string): Promise<StoredObject> {
    const normalized = this.normalize(key);
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: normalized }),
      );
      if (!result.Body) {
        throw new Error(`Empty body for s3://${this.bucket}/${normalized}`);
      }
      const chunks: Buffer[] = [];
      // Body is a stream in Node runtime.
      for await (const chunk of result.Body as AsyncIterable<Buffer | string>) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const out: StoredObject = { body: Buffer.concat(chunks) };
      if (result.ContentType) {
        out.contentType = result.ContentType;
      }
      return out;
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NoSuchKey') {
        throw new Error(`Object not found: s3://${this.bucket}/${normalized}`);
      }
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    const normalized = this.normalize(key);
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: normalized }),
      );
    } catch (error) {
      this.logger.error({ err: error, key: normalized, op: 'deleteObject' }, 's3 deleteObject failed');
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const normalized = this.normalize(key);
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: normalized }),
      { expiresIn: expiresInSeconds },
    );
  }

  /**
   * Apply the same traversal guard used by the local adapter. We pass a
   * dummy base — the resolver enforces no `..`/null/protocol regardless of
   * base, so the returned absolute path is just discarded and we keep the
   * caller-supplied key.
   */
  private normalize(key: string): string {
    resolveStorageKey('/var/empty/s3-key-check', key);
    return key;
  }
}
