import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AppConfigService } from '../../../../config/config.service';

/**
 * Protects internal read-only ops routes. Send `x-ops-key: <OPS_CONSOLE_SECRET>`.
 * In non-production, requests are allowed when no secret is configured (local DX).
 */
@Injectable()
export class OpsKeyGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.opsConsoleSecret;
    if (!secret) {
      if (this.config.isProduction) {
        throw new ForbiddenException('ops console is not configured');
      }
      return true;
    }
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const raw = request.headers['x-ops-key'];
    const key = Array.isArray(raw) ? raw[0] : raw;
    if (typeof key !== 'string' || key !== secret) {
      throw new ForbiddenException('invalid or missing x-ops-key');
    }
    return true;
  }
}
