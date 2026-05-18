import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { ChallengeEventEntity } from '../infrastructure/persistence/challenge-event.entity';
import { ChallengeLinkEntity } from '../infrastructure/persistence/challenge-link.entity';

export interface RecordChallengeEventCommand {
  challengeId: string;
  sessionId?: string;
  kind: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class RecordChallengeEventUseCase {
  constructor(
    @InjectRepository(ChallengeLinkEntity) private readonly links: Repository<ChallengeLinkEntity>,
    @InjectRepository(ChallengeEventEntity) private readonly events: Repository<ChallengeEventEntity>,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
  ) {}

  async execute(command: RecordChallengeEventCommand): Promise<void> {
    const link = await this.links.findOne({ where: { id: command.challengeId } });
    if (!link) {
      throw new NotFoundException(`Challenge ${command.challengeId} not found`);
    }
    const now = this.clock.now();
    const ev = new ChallengeEventEntity();
    ev.id = this.ids.generate();
    ev.challengeLinkId = command.challengeId;
    ev.sessionId = command.sessionId;
    ev.kind = command.kind;
    ev.payload = command.payload;
    ev.createdAt = now;
    await this.events.save(ev);
  }
}
