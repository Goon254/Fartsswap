import { Injectable, Logger } from '@nestjs/common';
import type { DiscordTransportPort } from '../domain/discord-transport.port';

@Injectable()
export class MockDiscordTransportAdapter implements DiscordTransportPort {
  readonly name = 'mock_discord';
  private readonly logger = new Logger(MockDiscordTransportAdapter.name);

  async deliverEphemeralNotice(message: string): Promise<void> {
    this.logger.debug({ message }, 'discord transport (mock): would deliver ephemeral notice');
  }
}
