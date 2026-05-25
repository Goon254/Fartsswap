import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../../config/config.module';
import { IdentityModule } from '../identity/identity.module';
import { FartmaximizerApplicationService } from './application/fartmaximizer-application.service';
import { FartmaxMealEntity } from './infrastructure/persistence/fartmax-meal.entity';
import { FartmaxVoteEntity } from './infrastructure/persistence/fartmax-vote.entity';
import { FartmaximizerPublicController } from './interface/http/fartmaximizer-public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FartmaxMealEntity, FartmaxVoteEntity]),
    AppConfigModule,
    IdentityModule,
  ],
  controllers: [FartmaximizerPublicController],
  providers: [FartmaximizerApplicationService],
  exports: [FartmaximizerApplicationService],
})
export class FartmaximizerModule {}
