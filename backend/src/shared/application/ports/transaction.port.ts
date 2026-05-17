/**
 * Abstraction over a database transaction.
 *
 * Application-layer use cases call `run` to ensure a group of repository
 * operations either all commit or all roll back. The implementation is
 * responsible for binding any participating repositories to the same
 * transactional context (e.g. via AsyncLocalStorage in the TypeORM adapter).
 *
 * Keep this interface tiny and free of ORM-specific types so use cases stay
 * framework-agnostic.
 */
export interface TransactionPort {
  run<T>(work: () => Promise<T>): Promise<T>;
}

export const TRANSACTION_PORT = Symbol('TRANSACTION_PORT');
