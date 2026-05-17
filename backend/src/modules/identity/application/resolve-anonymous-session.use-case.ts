import { Inject, Injectable } from '@nestjs/common';
import type { AnonymousSession } from '../../../shared/domain/models';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import {
  ANONYMOUS_SESSION_REPOSITORY,
  type AnonymousSessionRepository,
} from './ports/anonymous-session.repository';
import { CreateAnonymousSessionUseCase } from './create-anonymous-session.use-case';

@Injectable()
export class ResolveAnonymousSessionUseCase {
  constructor(
    @Inject(ANONYMOUS_SESSION_REPOSITORY)
    private readonly sessions: AnonymousSessionRepository,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly createSession: CreateAnonymousSessionUseCase,
  ) {}

  async execute(sessionId?: string): Promise<AnonymousSession> {
    if (!sessionId) {
      return this.createSession.execute();
    }

    const existing = await this.sessions.findById(sessionId);
    if (!existing) {
      return this.createSession.execute();
    }

    const expiresAt = new Date(existing.expiresAt);
    if (expiresAt <= this.clock.now()) {
      return this.createSession.execute();
    }

    const now = this.clock.now();
    await this.sessions.touch(sessionId, now);
    return {
      ...existing,
      lastSeenAt: now.toISOString(),
    };
  }
}
