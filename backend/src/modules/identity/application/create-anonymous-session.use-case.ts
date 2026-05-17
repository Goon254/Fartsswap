import { Inject, Injectable } from '@nestjs/common';
import type { AnonymousSession } from '../../../shared/domain/models';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { AppConfigService } from '../../../config/config.service';
import {
  ANONYMOUS_SESSION_REPOSITORY,
  type AnonymousSessionRepository,
} from './ports/anonymous-session.repository';

@Injectable()
export class CreateAnonymousSessionUseCase {
  constructor(
    @Inject(ANONYMOUS_SESSION_REPOSITORY)
    private readonly sessions: AnonymousSessionRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly config: AppConfigService,
  ) {}

  async execute(): Promise<AnonymousSession> {
    const now = this.clock.now();
    const ttlMs = this.config.session.ttlSeconds * 1000;
    const session: AnonymousSession = {
      id: this.ids.generate(),
      createdAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    };
    await this.sessions.save(session);
    return session;
  }
}
