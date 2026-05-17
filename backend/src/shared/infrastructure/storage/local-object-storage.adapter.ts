import { Injectable } from '@nestjs/common';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { dirname } from 'path';
import type { ObjectStoragePort, PutObjectOptions } from '../../application/ports/object-storage.port';
import { AppConfigService } from '../../../config/config.service';
import { resolveStorageKey } from './storage-key';

@Injectable()
export class LocalObjectStorageAdapter implements ObjectStoragePort {
  constructor(private readonly config: AppConfigService) {}

  async putObject(options: PutObjectOptions): Promise<string> {
    const fullPath = resolveStorageKey(this.config.storage.localPath, options.key);
    await mkdir(dirname(fullPath), { recursive: true });
    const body = typeof options.body === 'string' ? Buffer.from(options.body) : options.body;
    await writeFile(fullPath, body);
    return options.key;
  }

  async getObject(key: string): Promise<{ body: Buffer; contentType?: string }> {
    const fullPath = resolveStorageKey(this.config.storage.localPath, key);
    const body = await readFile(fullPath);
    const contentType = key.endsWith('.html')
      ? 'text/html; charset=utf-8'
      : key.endsWith('.json')
        ? 'application/json; charset=utf-8'
        : undefined;
    return { body, contentType };
  }

  async deleteObject(key: string): Promise<void> {
    const fullPath = resolveStorageKey(this.config.storage.localPath, key);
    try {
      await unlink(fullPath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    const fullPath = resolveStorageKey(this.config.storage.localPath, key);
    return `file://${fullPath}`;
  }
}
