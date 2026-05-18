import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';

/**
 * Protects creator / Discord-tooling routes. Send `x-creator-tools-key`.
 * Uses `CREATOR_TOOLS_SECRET` when set; otherwise falls back to `OPS_CONSOLE_SECRET`.
 * In non-production, requests are allowed when no effective secret is configured.
 */
@Injectable()
export class CreatorToolsKeyGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.creatorToolsEffectiveSecret;
    if (!secret) {
      if (this.config.isProduction) {
        throw new ForbiddenException('creator tools are not configured');
      }
      return true;
    }
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const raw = request.headers['x-creator-tools-key'];
    const key = Array.isArray(raw) ? raw[0] : raw;
    if (typeof key !== 'string' || key !== secret) {
      throw new ForbiddenException('invalid or missing x-creator-tools-key');
    }
    return true;
  }
}
