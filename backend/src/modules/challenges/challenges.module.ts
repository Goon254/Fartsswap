import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { ReportsModule } from '../reports/reports.module';
import { GetChallengeUseCase } from './application/get-challenge.use-case';
import { RecordChallengeEventUseCase } from './application/record-challenge-event.use-case';
import { RegisterChallengeUseCase } from './application/register-challenge.use-case';
import { ResolveChallengeUseCase } from './application/resolve-challenge.use-case';
import { ChallengeEventEntity } from './infrastructure/persistence/challenge-event.entity';
import { ChallengeLinkEntity } from './infrastructure/persistence/challenge-link.entity';
import { ChallengesController } from './interface/http/challenges.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChallengeLinkEntity, ChallengeEventEntity]),
    IdentityModule,
    ReportsModule,
  ],
  controllers: [ChallengesController],
  providers: [
    RegisterChallengeUseCase,
    GetChallengeUseCase,
    RecordChallengeEventUseCase,
    ResolveChallengeUseCase,
  ],
})
export class ChallengesModule {}
