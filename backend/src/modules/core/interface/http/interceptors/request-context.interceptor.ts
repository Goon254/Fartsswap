import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';

/** Attaches x-request-id for structured logs and future metrics export. */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const response = http.getResponse<FastifyReply>();

    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
    request.headers['x-request-id'] = requestId;
    void response.header('x-request-id', requestId);

    return next.handle();
  }
}
