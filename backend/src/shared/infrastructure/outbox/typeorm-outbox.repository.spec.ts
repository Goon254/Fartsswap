import { TypeOrmOutboxAdapter } from './typeorm-outbox.repository';
import type { Repository } from 'typeorm';
import type { AnalyticsOutboxEntity } from '../persistence/outbox.entity';
import type { ClockPort } from '../../application/ports/clock.port';
import type { IdGeneratorPort } from '../../application/ports/id-generator.port';

function makeRepo(): jest.Mocked<Repository<AnalyticsOutboxEntity>> {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    find: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    count: jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<Repository<AnalyticsOutboxEntity>>;
}

describe('TypeOrmOutboxAdapter.enqueue', () => {
  const fixedNow = new Date('2026-05-17T12:00:00.000Z');
  const clock: ClockPort = { now: () => fixedNow };
  const ids: IdGeneratorPort = { generate: () => 'outbox-1' };

  it('persists an outbox row with sane defaults', async () => {
    const repo = makeRepo();
    const adapter = new TypeOrmOutboxAdapter(repo, clock, ids);
    await adapter.enqueue({
      aggregateType: 'report',
      aggregateId: 'rep-1',
      eventType: 'report.generated',
      payload: { source: 'fake' },
    });

    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = repo.save.mock.calls[0]?.[0] as AnalyticsOutboxEntity;
    expect(saved.id).toBe('outbox-1');
    expect(saved.aggregateType).toBe('report');
    expect(saved.aggregateId).toBe('rep-1');
    expect(saved.eventType).toBe('report.generated');
    expect(saved.payload).toEqual({ source: 'fake' });
    expect(saved.attempts).toBe(0);
    expect(saved.nextAttemptAt).toEqual(fixedNow);
    expect(saved.createdAt).toEqual(fixedNow);
  });

  it('marks dispatched + failed via simple update calls', async () => {
    const repo = makeRepo();
    const adapter = new TypeOrmOutboxAdapter(repo, clock, ids);
    await adapter.markDispatched('outbox-1', fixedNow);
    expect(repo.update).toHaveBeenCalledWith({ id: 'outbox-1' }, { dispatchedAt: fixedNow });

    await adapter.markFailed('outbox-1', 2, fixedNow, 'boom');
    expect(repo.update).toHaveBeenLastCalledWith(
      { id: 'outbox-1' },
      { attempts: 2, nextAttemptAt: fixedNow, lastError: 'boom' },
    );
  });
});
