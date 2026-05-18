import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { ReportsModule } from '../reports/reports.module';
import { SponsorshipsModule } from '../sponsorships/sponsorships.module';
import { MethaneIndexQueryService } from './application/methane-index.query.service';
import { WrappedQueryService } from './application/wrapped.query.service';
import { MethaneIndexController } from './interface/http/methane-index.controller';
import { WrappedController } from './interface/http/wrapped.controller';

/** Public ritual read models (Methane Index, Fart Wrapped). */
@Module({
  imports: [IdentityModule, ReportsModule, SponsorshipsModule],
  controllers: [MethaneIndexController, WrappedController],
  providers: [MethaneIndexQueryService, WrappedQueryService],
  exports: [MethaneIndexQueryService, WrappedQueryService],
})
export class RitualsModule {}
