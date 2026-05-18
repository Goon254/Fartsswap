import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RateLimit } from '../../../../shared/interface/http/rate-limit.decorator';
import { CreatorDiscordCommandService } from '../../application/creator-discord-command.service';
import { CreatorToolsKeyGuard } from './creator-tools-key.guard';
import {
  DiscordBadgeBodyDto,
  DiscordChallengeBodyDto,
  DiscordClassifyBodyDto,
  DiscordShareBodyDto,
  DiscordWrappedBodyDto,
} from './dto/discord-command.dto';
import { DiscordMethaneQueryDto } from './dto/discord-methane-query.dto';

@ApiTags('creator-tools')
@Controller('api/v1/creator-tools/discord')
@UseGuards(CreatorToolsKeyGuard)
@ApiHeader({ name: 'x-creator-tools-key', required: true, description: 'CREATOR_TOOLS_SECRET or OPS_CONSOLE_SECRET' })
export class CreatorDiscordController {
  constructor(private readonly commands: CreatorDiscordCommandService) {}

  @Post('classify')
  @RateLimit({ max: 20, windowSeconds: 60 })
  @ApiOperation({ summary: 'Bot-style: mint a fake classification dossier (no session cookie)' })
  @ApiOkResponse({ description: 'Artifact payload + suggested Discord notice line' })
  async classify(@Body() body: DiscordClassifyBodyDto): Promise<Record<string, unknown>> {
    return this.commands.classify(body);
  }

  @Post('challenge')
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Bot-style: register a persisted challenge link' })
  async challenge(@Body() body: DiscordChallengeBodyDto): Promise<Record<string, unknown>> {
    return this.commands.challenge(body);
  }

  @Post('badge')
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Bot-style: issue a ceremonial bureau badge (payload only)' })
  async badge(@Body() body: DiscordBadgeBodyDto): Promise<Record<string, unknown>> {
    return this.commands.badge(body);
  }

  @Get('methane-index')
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Bot-style: pull current Methane Index envelope for reposting' })
  async methaneIndex(@Query() query: DiscordMethaneQueryDto): Promise<Record<string, unknown>> {
    return this.commands.methaneIndex(query);
  }

  @Post('wrapped')
  @RateLimit({ max: 30, windowSeconds: 60 })
  @ApiOperation({ summary: 'Bot-style: compile wrapped for sessionId or report slug' })
  async wrapped(@Body() body: DiscordWrappedBodyDto): Promise<Record<string, unknown>> {
    return this.commands.compileWrapped(body);
  }

  @Post('share')
  @RateLimit({ max: 40, windowSeconds: 60 })
  @ApiOperation({ summary: 'Bot-style: mint a share link for an existing report' })
  async share(@Body() body: DiscordShareBodyDto): Promise<Record<string, unknown>> {
    return this.commands.share(body);
  }
}
