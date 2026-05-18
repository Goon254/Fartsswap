import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { ReportsModule } from '../reports/reports.module';
import { RecordPremiumIntentUseCase } from './application/record-premium-intent.use-case';
import { EntitlementEntity } from './infrastructure/persistence/entitlement.entity';
import { PremiumIntentEntity } from './infrastructure/persistence/premium-intent.entity';
import { PremiumIntentsController } from './interface/http/premium-intents.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntitlementEntity, PremiumIntentEntity]),
    IdentityModule,
    ReportsModule,
  ],
  controllers: [PremiumIntentsController],
  providers: [RecordPremiumIntentUseCase],
})
export class CommerceModule {}
