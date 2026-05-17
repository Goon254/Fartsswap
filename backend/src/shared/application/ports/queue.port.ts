export interface QueueJobPayload {
  [key: string]: unknown;
}

export interface QueuePort {
  enqueue<T extends QueueJobPayload>(queueName: string, payload: T): Promise<string>;
}

export const QUEUE_PORT = Symbol('QUEUE_PORT');
