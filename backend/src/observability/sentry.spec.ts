import { captureException, flushSentry, initSentry } from './sentry';

describe('sentry helpers (no DSN configured)', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SENTRY_DSN;
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  it('initSentry is a no-op when SENTRY_DSN is unset', () => {
    expect(() => { initSentry(); }).not.toThrow();
  });

  it('captureException is a no-op when DSN unset', () => {
    expect(() => { captureException(new Error('x'), { foo: 'bar' }); }).not.toThrow();
  });

  it('flushSentry resolves immediately when DSN unset', async () => {
    await expect(flushSentry(10)).resolves.toBeUndefined();
  });
});
