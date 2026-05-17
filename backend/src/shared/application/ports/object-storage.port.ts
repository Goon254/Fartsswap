export interface PutObjectOptions {
  key: string;
  body: Buffer | string;
  contentType?: string;
}

export interface StoredObject {
  body: Buffer;
  contentType?: string;
}

export interface ObjectStoragePort {
  putObject(options: PutObjectOptions): Promise<string>;
  getObject(key: string): Promise<StoredObject>;
  deleteObject(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

export const OBJECT_STORAGE_PORT = Symbol('OBJECT_STORAGE_PORT');
