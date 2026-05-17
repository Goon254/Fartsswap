import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/database/run-migrations';
import { isDatabaseAvailable } from './helpers/database-available';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Health (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
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

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 30_000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /health returns ok', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /ready checks database', async () => {
    const response = await request(app.getHttpServer()).get('/ready').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.info.database.status).toBe('up');
  });
});
