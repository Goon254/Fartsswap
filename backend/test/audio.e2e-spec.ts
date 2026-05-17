import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { bootstrapTestApp, requireSetCookie, validWebmBuffer } from './helpers/bootstrap-test-app';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Audio (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp({ multipart: true });
  }, 30_000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('uploads real audio bytes, creates report, rejects spoofed mime', async () => {
    const buffer = validWebmBuffer();

    const uploadRes = await request(app.getHttpServer())
      .post('/api/v1/audio/uploads')
      .field('durationSeconds', '2')
      .attach('file', buffer, { filename: 'clip.webm', contentType: 'audio/webm' })
      .expect(201);

    expect(uploadRes.body.id).toBeDefined();
    expect(uploadRes.body.status).toBe('uploaded');
    expect(uploadRes.body.mimeType).toBe('audio/webm');

    const cookies = requireSetCookie(uploadRes);

    const metaRes = await request(app.getHttpServer())
      .get(`/api/v1/audio/uploads/${String(uploadRes.body.id)}`)
      .set('Cookie', cookies)
      .expect(200);
    expect(metaRes.body.storageKey).toBeUndefined();

    const reportRes = await request(app.getHttpServer())
      .post('/api/v1/reports/from-audio')
      .set('Cookie', cookies)
      .send({ audioUploadId: uploadRes.body.id, customFartName: 'Recorded Bean' })
      .expect(201);

    expect(reportRes.body.source).toBe('audio_recording');
    expect(reportRes.body.fartName).toBe('Recorded Bean');
  });

  it('rejects upload whose declared MIME is allowed but bytes are not really audio', async () => {
    const fakeBytes = Buffer.from('this is plain text claiming to be webm audio');
    await request(app.getHttpServer())
      .post('/api/v1/audio/uploads')
      .attach('file', fakeBytes, { filename: 'spoof.webm', contentType: 'audio/webm' })
      .expect(400);
  });

  it('rejects upload with disallowed declared MIME', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/audio/uploads')
      .attach('file', validWebmBuffer(), { filename: 'clip.wav', contentType: 'audio/wav' })
      .expect(400);
  });
});
