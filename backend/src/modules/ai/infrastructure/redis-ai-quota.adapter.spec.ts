import type { RedisClient } from '../../../shared/infrastructure/redis/redis.client';
import { RedisAiQuotaAdapter } from './redis-ai-quota.adapter';

const offlineRedis = { get: () => undefined } as unknown as RedisClient;

describe('RedisAiQuotaAdapter (in-memory fallback path)', () => {
  it('returns no decisions when given an empty check list', async () => {
    const adapter = new RedisAiQuotaAdapter(offlineRedis);
    await expect(adapter.consume([])).resolves.toEqual([]);
  });

  it('increments per-(scope,identifier,day) and flips exceeded after the limit', async () => {
    const adapter = new RedisAiQuotaAdapter(offlineRedis);
    const first = await adapter.consume([
      { scope: 'session', identifier: 'sess-a', limit: 2 },
    ]);
    expect(first).toEqual([
      expect.objectContaining({ scope: 'session', count: 1, limit: 2, exceeded: false }),
    ]);
    const second = await adapter.consume([
      { scope: 'session', identifier: 'sess-a', limit: 2 },
    ]);
    expect(second[0]?.exceeded).toBe(false);
    const third = await adapter.consume([
      { scope: 'session', identifier: 'sess-a', limit: 2 },
    ]);
    expect(third[0]?.exceeded).toBe(true);
    expect(third[0]?.count).toBe(3);
  });

  it('isolates counters per scope and per identifier', async () => {
    const adapter = new RedisAiQuotaAdapter(offlineRedis);
    const a1 = (await adapter.consume([{ scope: 'session', identifier: 'A', limit: 5 }]))[0];
    const a2 = (await adapter.consume([{ scope: 'session', identifier: 'B', limit: 5 }]))[0];
    const a3 = (await adapter.consume([{ scope: 'ip', identifier: 'A', limit: 5 }]))[0];
    expect(a1?.count).toBe(1);
    expect(a2?.count).toBe(1);
    expect(a3?.count).toBe(1);
  });

  it('treats empty identifiers as a no-op', async () => {
    const adapter = new RedisAiQuotaAdapter(offlineRedis);
    const decisions = await adapter.consume([
      { scope: 'session', identifier: '', limit: 5 },
    ]);
    expect(decisions).toEqual([
      expect.objectContaining({ count: 0, exceeded: false }),
    ]);
  });
});
