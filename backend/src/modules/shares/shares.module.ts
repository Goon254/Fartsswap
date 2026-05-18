import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsModule } from '../reports/reports.module';
import { IdentityModule } from '../identity/identity.module';
import { CreateShareLinkUseCase } from './application/create-share-link.use-case';
import { ShareEventEntity } from './infrastructure/persistence/share-event.entity';
import { ShareLinkEntity } from './infrastructure/persistence/share-link.entity';
import { SharesController } from './interface/http/shares.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShareLinkEntity, ShareEventEntity]),
    IdentityModule,
    ReportsModule,
  ],
  controllers: [SharesController],
  providers: [CreateShareLinkUseCase],
})
export class SharesModule {}
