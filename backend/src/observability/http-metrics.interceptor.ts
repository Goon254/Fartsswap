import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { MetricsService } from './metrics.service';

/**
 * Records `http_requests_total` + `http_request_duration_seconds` for every
 * request. Uses the Nest handler name as the "route" label so cardinality
 * stays bounded (path-param values like /reports/<uuid> don't blow it up).
 *
 * Skips the metrics endpoint itself to avoid recursive accounting.
 */
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();
    const method = request.method;
    const route = `${context.getClass().name}.${context.getHandler().name}`;

    if (request.url === '/metrics') {
      return next.handle();
    }

    const stopTimer = this.metrics.httpRequestDurationSeconds.startTimer({
      method,
      route,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const status = String(reply.statusCode);
          this.metrics.httpRequestsTotal.inc({ method, route, status_code: status });
          stopTimer({ status_code: status });
        },
        error: () => {
          const status = String(reply.statusCode || 500);
          this.metrics.httpRequestsTotal.inc({ method, route, status_code: status });
          stopTimer({ status_code: status });
        },
      }),
    );
  }
}
