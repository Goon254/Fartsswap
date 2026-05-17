import { ValidationPipe } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from '../../src/app.module';
import { runMigrations } from '../../src/database/run-migrations';
import { isDatabaseAvailable } from './database-available';

export const TEST_COOKIE_SECRET = 'farts-e2e-secret-farts-e2e-secret-farts-e2e';

/**
 * Boot the real AppModule on Fastify with the same plugins production uses,
 * so e2e specs exercise signed cookies, multipart, and rate-limit interceptors
 * the same way clients will.
 */
export async function bootstrapTestApp(options: {
  multipart?: boolean;
} = {}): Promise<NestFastifyApplication> {
  const available = await isDatabaseAvailable();
  if (!available) {
    throw new Error(
      'Postgres is not reachable. Start it with: docker compose up -d postgres',
    );
  }

  await runMigrations();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await app.register(fastifyCookie, { secret: TEST_COOKIE_SECRET });
  if (options.multipart) {
    await app.register(fastifyMultipart, { limits: { fileSize: 1_048_576, files: 1 } });
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}

/** Minimal valid WebM payload that passes the magic-byte sniffer in tests. */
export function validWebmBuffer(): Buffer {
  return Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
    Buffer.from('webm'),
    Buffer.from('rest-of-payload-for-test'),
  ]);
}

/**
 * Pull `set-cookie` from a supertest response and assert it exists.
 * Returns `string[]` so subsequent `.set('Cookie', ...)` calls type-check.
 */
export function requireSetCookie(response: { headers: Record<string, unknown> }): string[] {
  const raw = response.headers['set-cookie'];
  if (!raw) throw new Error('expected Set-Cookie header on response');
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') return [raw];
  throw new Error(`unexpected set-cookie shape: ${typeof raw}`);
}
