import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { bootstrapTestApp } from './helpers/bootstrap-test-app';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Health (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  }, 30_000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /health is a liveness probe and does not depend on the DB', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(response.body.timestamp).toBeDefined();
  });

  it('GET /ready checks database and storage', async () => {
    const response = await request(app.getHttpServer()).get('/ready').expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.info.database.status).toBe('up');
    expect(response.body.info.storage.status).toBe('up');
  });
});
