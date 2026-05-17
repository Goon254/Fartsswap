export interface OutboxEventInput {
  aggregateType: string;
  aggregateId?: string;
  eventType: string;
  payload: Record<string, unknown>;
}

/**
 * Append-only outbox abstraction.
 *
 * Inside a DB transaction, use cases call `enqueue` to atomically stage an
 * analytics event alongside their business write. A background dispatcher
 * later picks pending rows up and calls the real analytics sink, providing
 * at-least-once delivery without coupling the request path to its success.
 */
export interface OutboxPort {
  enqueue(event: OutboxEventInput): Promise<void>;
}

export const OUTBOX_PORT = Symbol('OUTBOX_PORT');
