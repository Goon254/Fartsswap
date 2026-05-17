import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { bootstrapTestApp, requireSetCookie } from './helpers/bootstrap-test-app';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Reports (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  }, 30_000);

  afterAll(async () => {
    if (app) await app.close();
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

    const cookies = requireSetCookie(createResponse);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/reports/${String(createResponse.body.id)}`)
      .set('Cookie', cookies)
      .expect(200);

    expect(getResponse.body.id).toBe(createResponse.body.id);
  });

  it('Idempotency-Key replays the same response and surfaces Idempotent-Replayed header', async () => {
    const key = randomUUID();
    const first = await request(app.getHttpServer())
      .post('/api/v1/reports/fake')
      .set('Idempotency-Key', key)
      .send({ customFartName: 'Idem Bean' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/api/v1/reports/fake')
      .set('Idempotency-Key', key)
      .send({ customFartName: 'Idem Bean' })
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(second.headers['idempotent-replayed']).toBe('true');
  });

  it('Idempotency-Key with a different body returns 409', async () => {
    const key = randomUUID();
    await request(app.getHttpServer())
      .post('/api/v1/reports/fake')
      .set('Idempotency-Key', key)
      .send({ customFartName: 'First Body' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/reports/fake')
      .set('Idempotency-Key', key)
      .send({ customFartName: 'Different Body' })
      .expect(409);
  });
});
