import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ChallengeLinkEntity } from '../infrastructure/persistence/challenge-link.entity';
import { RecordChallengeEventUseCase } from './record-challenge-event.use-case';

export interface ResolveChallengeCommand {
  challengeId: string;
  sessionId?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class ResolveChallengeUseCase {
  constructor(
    @InjectRepository(ChallengeLinkEntity) private readonly links: Repository<ChallengeLinkEntity>,
    private readonly recordEvent: RecordChallengeEventUseCase,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: ResolveChallengeCommand): Promise<void> {
    const link = await this.links.findOne({ where: { id: command.challengeId } });
    if (!link) {
      throw new NotFoundException(`Challenge ${command.challengeId} not found`);
    }
    const now = this.clock.now();
    await this.links.update(
      { id: command.challengeId },
      { resolvedAt: now },
    );
    await this.recordEvent.execute({
      challengeId: command.challengeId,
      sessionId: command.sessionId,
      kind: 'resolved',
      payload: command.payload,
    });
  }
}
