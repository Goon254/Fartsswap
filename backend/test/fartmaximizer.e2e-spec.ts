import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { bootstrapTestApp, requireSetCookie } from './helpers/bootstrap-test-app';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Fartmaximizer (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  }, 30_000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /api/v1/fartmaximizer/leaderboard returns seeded meals', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/fartmaximizer/leaderboard')
      .expect(200);

    expect(res.body.enabled).toBe(true);
    expect(Array.isArray(res.body.meals)).toBe(true);
    expect(res.body.meals.length).toBeGreaterThanOrEqual(20);
    expect(res.body.meals[0].name).toContain('Airport Chili');
    expect(typeof res.body.meals[0].votes).toBe('number');
  });

  it('POST submit + vote updates leaderboard for session', async () => {
    const board0 = await request(app.getHttpServer())
      .get('/api/v1/fartmaximizer/leaderboard')
      .expect(200);
    const cookies = requireSetCookie(board0);

    const created = await request(app.getHttpServer())
      .post('/api/v1/fartmaximizer/meals')
      .set('Cookie', cookies)
      .send({ name: 'E2E Toxic Tasting Menu', description: 'Filed under duress.' })
      .expect(201);

    expect(created.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const topId = board0.body.meals[0].id as string;
    const voted = await request(app.getHttpServer())
      .post(`/api/v1/fartmaximizer/meals/${topId}/vote`)
      .set('Cookie', cookies)
      .send({ direction: 'up' })
      .expect(200);

    expect(voted.body.myVotes[topId]).toBe('up');
    const row = voted.body.meals.find((m: { id: string }) => m.id === topId);
    expect(row).toBeDefined();
    expect(board0.body.meals[0].votes).toBeLessThanOrEqual(row.votes);
  });
});
