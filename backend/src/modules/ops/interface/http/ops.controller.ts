import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import {
  OpsDashboardQueryService,
  type OpsDashboardPayload,
} from '../../application/ops-dashboard.query.service';
import { OpsKeyGuard } from './ops-key.guard';

@ApiTags('ops')
@Controller('api/v1/ops')
@UseGuards(OpsKeyGuard)
export class OpsController {
  constructor(private readonly opsDashboard: OpsDashboardQueryService) {}

  @Get('dashboard')
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Internal launch metrics (requires x-ops-key)' })
  @ApiHeader({ name: 'x-ops-key', required: true })
  async dashboard(@Query('hours') hoursRaw?: string): Promise<OpsDashboardPayload> {
    const parsed = hoursRaw === undefined ? 24 : Number.parseInt(hoursRaw, 10);
    const hours = Number.isFinite(parsed) ? parsed : 24;
    return this.opsDashboard.getDashboard(hours);
  }
}
