import { AsyncLocalStorage } from 'async_hooks';
import type { EntityManager } from 'typeorm';

/**
 * Ambient transaction context carried via AsyncLocalStorage.
 *
 * The TypeORM transaction adapter sets the active `EntityManager` here for the
 * duration of a `run(...)` call. TypeORM-backed repositories use
 * `getTransactionalManager()` to detect an active transaction and route their
 * writes through the same manager so the whole block commits atomically.
 *
 * This is intentionally infrastructure-only — application code must not
 * import it. Use cases interact with `TransactionPort` instead.
 */
const storage = new AsyncLocalStorage<EntityManager>();

export function runWithTransaction<T>(
  manager: EntityManager,
  work: () => Promise<T>,
): Promise<T> {
  return storage.run(manager, work);
}

export function getTransactionalManager(): EntityManager | undefined {
  return storage.getStore();
}
