import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let metrics: MetricsService;

  beforeEach(() => {
    metrics = new MetricsService();
    metrics.onModuleInit();
  });

  it('exposes the prometheus text content type', () => {
    expect(metrics.contentType()).toMatch(/text\/plain/);
  });

  it('renders default node metrics + custom counters in the snapshot', async () => {
    metrics.reportsCreatedTotal.inc({ source: 'fake' });
    metrics.audioUploadsTotal.inc({ outcome: 'accepted' });
    metrics.artifactsGeneratedTotal.inc({ type: 'share_card', outcome: 'ok' });

    const out = await metrics.snapshot();
    expect(out).toContain('process_cpu_seconds_total');
    expect(out).toContain('reports_created_total');
    expect(out).toContain('source="fake"');
    expect(out).toContain('audio_uploads_total');
    expect(out).toContain('artifacts_generated_total');
  });

  it('tracks HTTP duration histogram by labels', async () => {
    const stop = metrics.httpRequestDurationSeconds.startTimer({
      method: 'GET',
      route: 'Health.liveness',
    });
    await new Promise((r) => setTimeout(r, 5));
    stop({ status_code: '200' });
    metrics.httpRequestsTotal.inc({
      method: 'GET',
      route: 'Health.liveness',
      status_code: '200',
    });

    const out = await metrics.snapshot();
    expect(out).toContain('http_request_duration_seconds_bucket');
    expect(out).toContain('http_requests_total{method="GET",route="Health.liveness",status_code="200"}');
  });
});
