import type { AnonymousSession } from '../../../../shared/domain/models';

export interface AnonymousSessionRepository {
  save(session: AnonymousSession): Promise<void>;
  findById(id: string): Promise<AnonymousSession | null>;
  touch(id: string, lastSeenAt: Date): Promise<void>;
}

export const ANONYMOUS_SESSION_REPOSITORY = Symbol('ANONYMOUS_SESSION_REPOSITORY');
