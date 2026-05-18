import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { OpsKeyGuard } from '../../../ops/interface/http/ops-key.guard';
import { SponsorshipCampaignAdminService } from '../../application/sponsorship-campaign-admin.service';
import type { SponsorshipCampaignStatus } from '../../domain/sponsorship-slots';

class CreateCampaignBody {
  internalName!: string;
  sponsorPublicLabel!: string;
  validFromIso!: string;
  validUntilIso!: string;
  status?: SponsorshipCampaignStatus;
  operatorNotes?: string;
}

class AddPlacementBody {
  slotCode!: string;
  ceremonialField!: string;
  creativePayload!: unknown;
  displayPriority?: number;
  previewOk?: boolean;
}

class SetStatusBody {
  status!: SponsorshipCampaignStatus;
}

@ApiTags('ops-sponsorship')
@Controller('api/v1/ops/sponsorship')
@UseGuards(OpsKeyGuard)
export class SponsorshipOpsController {
  constructor(private readonly admin: SponsorshipCampaignAdminService) {}

  @Get('campaigns')
  @RateLimit({ max: 20, windowSeconds: 60 })
  @ApiOperation({ summary: 'List sponsorship campaigns (x-ops-key)' })
  @ApiHeader({ name: 'x-ops-key', required: true })
  async list() {
    return this.admin.listCampaigns();
  }

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 20, windowSeconds: 60 })
  @ApiOperation({ summary: 'Create campaign' })
  async create(@Body() body: CreateCampaignBody) {
    return this.admin.createCampaign(body);
  }

  @Post('campaigns/:campaignId/placements')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Add placement to campaign' })
  async addPlacement(@Param('campaignId') campaignId: string, @Body() body: AddPlacementBody) {
    return this.admin.addPlacement(campaignId, body);
  }

  @Post('campaigns/:campaignId/status')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Set campaign status (e.g. active after review)' })
  async setStatus(@Param('campaignId') campaignId: string, @Body() body: SetStatusBody) {
    return this.admin.setCampaignStatus(campaignId, body.status);
  }

  @Post('seed-demo')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ max: 5, windowSeconds: 300 })
  @ApiOperation({ summary: 'Seed a demo active campaign (dev / lab)' })
  async seedDemo() {
    return this.admin.seedDemoCampaign();
  }
}
