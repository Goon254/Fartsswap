import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { ReportsModule } from '../reports/reports.module';
import { RitualsModule } from '../rituals/rituals.module';
import { SharesModule } from '../shares/shares.module';
import { SharedModule } from '../../shared/shared.module';
import { PlansModule } from '../plans/plans.module';
import { CreatorDiscordCommandService } from './application/creator-discord-command.service';
import { MockDiscordTransportAdapter } from './infrastructure/mock-discord-transport.adapter';
import { CreatorDiscordController } from './interface/http/creator-discord.controller';
import { CreatorToolsKeyGuard } from './interface/http/creator-tools-key.guard';

/**
 * Discord-first / community creator utilities. Transport starts mocked;
 * swap `DiscordTransportPort` binding for a real webhook adapter later.
 */
@Module({
  imports: [SharedModule, AnalyticsModule, ReportsModule, ChallengesModule, SharesModule, RitualsModule, PlansModule],
  controllers: [CreatorDiscordController],
  providers: [CreatorToolsKeyGuard, CreatorDiscordCommandService, MockDiscordTransportAdapter],
})
export class CreatorToolsModule {}
