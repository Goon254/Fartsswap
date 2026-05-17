import { getTransactionalManager, runWithTransaction } from './transaction-context';

describe('transaction-context (AsyncLocalStorage)', () => {
  it('returns undefined outside a transaction', () => {
    expect(getTransactionalManager()).toBeUndefined();
  });

  it('exposes the manager inside runWithTransaction', async () => {
    const fakeManager = { _id: 'manager-1' } as unknown as Parameters<
      typeof runWithTransaction
    >[0];
    let observed: unknown;
    await runWithTransaction(fakeManager, async () => {
      observed = getTransactionalManager();
    });
    expect(observed).toBe(fakeManager);
    expect(getTransactionalManager()).toBeUndefined();
  });

  it('keeps nested async operations bound to the same manager', async () => {
    const fakeManager = { _id: 'manager-2' } as unknown as Parameters<
      typeof runWithTransaction
    >[0];
    const observed: unknown[] = [];
    await runWithTransaction(fakeManager, async () => {
      observed.push(getTransactionalManager());
      await new Promise((r) => setTimeout(r, 1));
      observed.push(getTransactionalManager());
    });
    expect(observed).toEqual([fakeManager, fakeManager]);
  });
});
