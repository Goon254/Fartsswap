import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/database/run-migrations';
import { isDatabaseAvailable } from './helpers/database-available';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Reports (e2e)', () => {
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
    await app.register(fastifyCookie);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 30_000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /api/v1/reports/fake creates and GET retrieves report', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/reports/fake')
      .send({ customFartName: 'E2E Bean', tonePreset: 'clinical' })
      .expect(201);

    expect(createResponse.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(createResponse.body.fartName).toBe('E2E Bean');
    expect(createResponse.body.status).toBe('completed');
    expect(createResponse.body.source).toBe('fake');
    expect(createResponse.body.fartHash).toMatch(/^fart_/);

    const cookies = createResponse.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/reports/${createResponse.body.id}`)
      .set('Cookie', cookies)
      .expect(200);

    expect(getResponse.body.id).toBe(createResponse.body.id);
    expect(getResponse.body.classification).toBe(createResponse.body.classification);
  });
});
