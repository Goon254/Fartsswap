import { Module } from '@nestjs/common';
import { OpsDashboardQueryService } from './application/ops-dashboard.query.service';
import { OpsController } from './interface/http/ops.controller';
import { OpsKeyGuard } from './interface/http/ops-key.guard';

/** Internal read-only metrics for launch / mission-control surfaces. */
@Module({
  controllers: [OpsController],
  providers: [OpsKeyGuard, OpsDashboardQueryService],
})
export class OpsModule {}
