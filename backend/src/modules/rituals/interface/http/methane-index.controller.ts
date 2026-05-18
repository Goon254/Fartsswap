import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MethaneIndexQueryService } from '../../application/methane-index.query.service';
import type { MethaneIndexEnvelopeDto, MethaneIndexHistoryDto } from './dto/methane-index.dto';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';

@ApiTags('methane-index')
@Controller('api/v1/methane-index')
export class MethaneIndexController {
  constructor(private readonly methane: MethaneIndexQueryService) {}

  @Get('current')
  @RateLimit({ max: 60, windowSeconds: 60 })
  @ApiOperation({ summary: 'Current National Methane Index bulletin (query-backed)' })
  @ApiOkResponse({ description: 'Issue envelope; issue is null when no filings exist (client may fall back).' })
  async current(): Promise<MethaneIndexEnvelopeDto> {
    return this.methane.getCurrent();
  }

  @Get('history')
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Recent Methane Index windows (rolling 7-day UTC slices)' })
  @ApiOkResponse({ description: 'Most recent window first' })
  async history(@Query('limit') limitRaw?: string): Promise<MethaneIndexHistoryDto> {
    const parsed = limitRaw === undefined ? 4 : Number.parseInt(limitRaw, 10);
    const limit = Number.isFinite(parsed) ? parsed : 4;
    return this.methane.getHistory(limit);
  }
}
