import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/database/run-migrations';
import { isDatabaseAvailable } from './helpers/database-available';

const describeE2e = process.env.SKIP_E2E === 'true' ? describe.skip : describe;

describeE2e('Audio (e2e)', () => {
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
    await app.register(fastifyMultipart, { limits: { fileSize: 1_048_576, files: 1 } });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 30_000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('uploads audio, creates report from audio, and rejects bad mime', async () => {
    const buffer = Buffer.from('fake-webm-audio-bytes');

    const uploadRes = await request(app.getHttpServer())
      .post('/api/v1/audio/uploads')
      .field('durationSeconds', '2')
      .attach('file', buffer, { filename: 'clip.webm', contentType: 'audio/webm' })
      .expect(201);

    expect(uploadRes.body.id).toBeDefined();
    expect(uploadRes.body.status).toBe('uploaded');
    expect(uploadRes.body.mimeType).toBe('audio/webm');

    const cookies = uploadRes.headers['set-cookie'];

    const metaRes = await request(app.getHttpServer())
      .get(`/api/v1/audio/uploads/${uploadRes.body.id}`)
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

    await request(app.getHttpServer())
      .post('/api/v1/audio/uploads')
      .attach('file', buffer, { filename: 'clip.wav', contentType: 'audio/wav' })
      .expect(400);
  });
});
