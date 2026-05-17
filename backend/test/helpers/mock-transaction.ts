import type { TransactionPort } from '../../src/shared/application/ports/transaction.port';

/**
 * Pass-through TransactionPort for unit tests — just runs the work function
 * without an actual DB transaction. Use this anywhere a use case takes a
 * TransactionPort and the test isn't exercising real persistence.
 */
export function fakeTransactionPort(): TransactionPort {
  return {
    run: async <T>(work: () => Promise<T>): Promise<T> => work(),
  };
}

/**
 * Minimal mock for TrackAnalyticsEventUseCase with both `execute` and
 * `trackBestEffort` so use-case tests don't blow up on the new method.
 */
export function fakeTrackAnalytics(): {
  execute: jest.Mock;
  trackBestEffort: jest.Mock;
} {
  return {
    execute: jest.fn().mockResolvedValue({}),
    trackBestEffort: jest.fn().mockResolvedValue(undefined),
  };
}
