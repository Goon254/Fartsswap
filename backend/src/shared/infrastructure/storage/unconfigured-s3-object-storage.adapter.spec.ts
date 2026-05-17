import { UnconfiguredS3ObjectStorageAdapter } from './unconfigured-s3-object-storage.adapter';
import type { AppConfigService } from '../../../config/config.service';

describe('UnconfiguredS3ObjectStorageAdapter', () => {
  const config = {
    storage: { provider: 's3' },
  } as unknown as AppConfigService;
  const adapter = new UnconfiguredS3ObjectStorageAdapter(config);

  it('throws on putObject (never silently lies)', async () => {
    await expect(
      adapter.putObject({ key: 'k', body: Buffer.from('x') }),
    ).rejects.toThrow(/S3 object storage is not implemented/);
  });

  it('throws on getObject', async () => {
    await expect(adapter.getObject('k')).rejects.toThrow(/not implemented/);
  });

  it('throws on deleteObject', async () => {
    await expect(adapter.deleteObject('k')).rejects.toThrow(/not implemented/);
  });

  it('throws on getSignedUrl', async () => {
    await expect(adapter.getSignedUrl('k')).rejects.toThrow(/not implemented/);
  });
});
