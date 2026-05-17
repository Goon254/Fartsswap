import { AiReportOrchestrator } from './ai-report.orchestrator';
import type { AppConfigService } from '../../../config/config.service';
import { AnalyticsEventType, ReportSource } from '../../../shared/domain/types';
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProviderPort,
} from '../../../shared/application/ports/ai-provider.port';
import type { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { fakeTrackAnalytics } from '../../../../test/helpers/mock-transaction';
import { MetricsService } from '../../../observability/metrics.service';
import type {
  AiQuotaPort,
  QuotaCheckRequest,
  QuotaDecision,
} from './ports/ai-quota.port';

function buildConfig(
  overrides?: Partial<AppConfigService['ai']>,
): AppConfigService {
  return {
    ai: {
      enabled: true,
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
      timeoutMs: 1000,
      maxTokens: 200,
      temperature: 0.9,
      maxRetries: 0,
      debugLog: false,
      callable: true,
      dailySessionLimit: 50,
      dailyIpLimit: 200,
      ...overrides,
    },
  } as unknown as AppConfigService;
}

interface StubProvider extends AiProviderPort {
  invocations: AiCompletionRequest[];
}

function callableProvider(response: string): StubProvider {
  const invocations: AiCompletionRequest[] = [];
  return {
    isCallable: true,
    id: 'openai',
    model: 'gpt-4o-mini',
    invocations,
    complete: jest.fn(async (req: AiCompletionRequest): Promise<AiCompletionResponse> => {
      invocations.push(req);
      return { text: response, provider: 'openai', model: 'gpt-4o-mini', latencyMs: 10 };
    }),
  };
}

function failingProvider(error: Error): StubProvider {
  return {
    isCallable: true,
    id: 'openai',
    model: 'gpt-4o-mini',
    invocations: [],
    complete: jest.fn(async () => {
      throw error;
    }),
  };
}

function disabledProvider(): StubProvider {
  return {
    isCallable: false,
    id: 'disabled',
    model: 'disabled',
    invocations: [],
    complete: jest.fn(async () => {
      throw new Error('disabled');
    }),
  };
}

function unlimitedQuota(): AiQuotaPort {
  return {
    consume: jest.fn(async (checks: QuotaCheckRequest[]): Promise<QuotaDecision[]> =>
      checks.map((c) => ({ ...c, count: 1, exceeded: false })),
    ),
  };
}

function exceededQuota(scope: 'session' | 'ip'): AiQuotaPort {
  return {
    consume: jest.fn(async (checks: QuotaCheckRequest[]): Promise<QuotaDecision[]> =>
      checks.map((c) => ({
        ...c,
        count: c.limit + 1,
        exceeded: c.scope === scope,
      })),
    ),
  };
}

function makeMetrics(): MetricsService {
  const m = new MetricsService();
  m.onModuleInit();
  return m;
}

describe('AiReportOrchestrator', () => {
  let trackEvent: ReturnType<typeof fakeTrackAnalytics>;

  beforeEach(() => {
    trackEvent = fakeTrackAnalytics();
  });

  it('uses the model output happy path', async () => {
    const provider = callableProvider(
      JSON.stringify({
        fartName: 'Velvet Decree',
        classification: 'The Philosopher',
        powerScore: 73,
        emotionalTone: 'Wistful defiance',
        probableCause: 'Suspicious chili',
        cinematicParallel: 'A submarine thriller',
        threatLevel: 'Amber',
        shortSummary: 'A measured emission.',
      }),
    );
    const orchestrator = new AiReportOrchestrator(
      provider,
      unlimitedQuota(),
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({
      source: ReportSource.FAKE,
      customFartName: 'Velvet Decree',
      seed: 'seed-happy',
      sessionId: 'sess-h',
      ipAddress: '203.0.113.1',
    });

    expect(result.meta.source).toBe('model');
    expect(result.meta.fallbackUsed).toBe(false);
    expect(result.fields.fartName).toBe('Velvet Decree');
    expect(provider.complete).toHaveBeenCalledTimes(1);
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AnalyticsEventType.AI_REPORT_REQUESTED }),
    );
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AnalyticsEventType.AI_REPORT_SUCCEEDED,
        payload: expect.objectContaining({ provider: 'openai', fallbackUsed: false }),
      }),
    );
  });

  it('falls back when the provider is not callable (AI disabled)', async () => {
    const provider = disabledProvider();
    const orchestrator = new AiReportOrchestrator(
      provider,
      unlimitedQuota(),
      buildConfig({ enabled: false, callable: false, provider: 'disabled' }),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({
      source: ReportSource.FAKE,
      seed: 'seed-off',
    });

    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.meta.fallbackReason).toBe('provider_not_callable');
    expect(provider.complete).not.toHaveBeenCalled();
  });

  it('falls back when the model returns invalid JSON', async () => {
    const orchestrator = new AiReportOrchestrator(
      callableProvider('I refuse to comply.'),
      unlimitedQuota(),
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({
      source: ReportSource.FAKE,
      seed: 'seed-bad-json',
    });

    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.meta.fallbackReason).toBe('parse_not_json');
  });

  it('falls back when the provider call throws (timeout / network)', async () => {
    const err = new Error('AI completion timed out after 1000ms');
    err.name = 'AiTimeoutError';
    const orchestrator = new AiReportOrchestrator(
      failingProvider(err),
      unlimitedQuota(),
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({
      source: ReportSource.AUDIO_RECORDING,
      durationSeconds: 3,
      seed: 'seed-timeout',
    });

    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.meta.fallbackReason).toBe('timeout');
    expect(result.fields.durationMs).toBe(3000);
  });

  it('falls back when the model output contains disallowed content (sanitised to defaults)', async () => {
    const provider = callableProvider(
      JSON.stringify({
        fartName: 'sexual title',
        classification: 'sex thing',
        probableCause: 'kill yourself',
        emotionalTone: 'porn',
      }),
    );
    const orchestrator = new AiReportOrchestrator(
      provider,
      unlimitedQuota(),
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({ source: ReportSource.FAKE, seed: 'seed-unsafe' });

    expect(result.meta.source).toBe('model');
    expect(result.fields.fartName).not.toMatch(/sex/i);
    expect(result.fields.probableCause).not.toMatch(/kill yourself/i);
    expect(result.fields.emotionalTone).not.toMatch(/porn/i);
  });

  it('never includes prompts or raw responses in analytics payloads', async () => {
    const orchestrator = new AiReportOrchestrator(
      callableProvider('{"classification": "X"}'),
      unlimitedQuota(),
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    await orchestrator.generate({ source: ReportSource.FAKE, seed: 'seed-no-prompt' });

    for (const call of trackEvent.trackBestEffort.mock.calls) {
      const payload = JSON.stringify(call[0]);
      expect(payload).not.toMatch(/system|user|prompt|raw|completion|chat/i);
    }
  });

  describe('quota enforcement', () => {
    it('skips the provider call when per-session quota is exceeded', async () => {
      const provider = callableProvider('{"classification": "X"}');
      const quota = exceededQuota('session');
      const metrics = makeMetrics();
      const orchestrator = new AiReportOrchestrator(
        provider,
        quota,
        buildConfig(),
        trackEvent as unknown as TrackAnalyticsEventUseCase,
        metrics,
      );

      const result = await orchestrator.generate({
        source: ReportSource.FAKE,
        seed: 'seed-quota-session',
        sessionId: 'sess-over',
        ipAddress: '203.0.113.2',
      });

      expect(provider.complete).not.toHaveBeenCalled();
      expect(result.meta.fallbackUsed).toBe(true);
      expect(result.meta.fallbackReason).toBe('quota_exceeded:session');
      const snapshot = await metrics.snapshot();
      expect(snapshot).toContain('ai_reports_attempted_total{source="fake"} 1');
      expect(snapshot).toContain('ai_reports_quota_exceeded_total{scope="session"} 1');

      expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AnalyticsEventType.AI_REPORT_FAILED,
          payload: expect.objectContaining({ reason: 'quota_exceeded:session' }),
        }),
      );
    });

    it('skips the provider call when per-IP quota is exceeded', async () => {
      const provider = callableProvider('{"classification": "X"}');
      const metrics = makeMetrics();
      const orchestrator = new AiReportOrchestrator(
        provider,
        exceededQuota('ip'),
        buildConfig(),
        trackEvent as unknown as TrackAnalyticsEventUseCase,
        metrics,
      );

      const result = await orchestrator.generate({
        source: ReportSource.AUDIO_RECORDING,
        durationSeconds: 1.5,
        seed: 'seed-quota-ip',
        sessionId: 'sess-fine',
        ipAddress: '203.0.113.99',
      });

      expect(provider.complete).not.toHaveBeenCalled();
      expect(result.meta.fallbackReason).toBe('quota_exceeded:ip');
      const snapshot = await metrics.snapshot();
      expect(snapshot).toContain('ai_reports_quota_exceeded_total{scope="ip"} 1');
    });

    it('allows the call when under both limits', async () => {
      const provider = callableProvider('{"classification": "X"}');
      const quota = unlimitedQuota();
      const orchestrator = new AiReportOrchestrator(
        provider,
        quota,
        buildConfig(),
        trackEvent as unknown as TrackAnalyticsEventUseCase,
      );

      await orchestrator.generate({
        source: ReportSource.FAKE,
        seed: 'seed-quota-under',
        sessionId: 'sess-under',
        ipAddress: '203.0.113.10',
      });

      expect(provider.complete).toHaveBeenCalledTimes(1);
      expect(quota.consume).toHaveBeenCalledWith([
        { scope: 'session', identifier: 'sess-under', limit: 50 },
        { scope: 'ip', identifier: '203.0.113.10', limit: 200 },
      ]);
    });

    it('allows the call when a limit is set to 0 (disabled)', async () => {
      const provider = callableProvider('{"classification": "X"}');
      const quota = unlimitedQuota();
      const orchestrator = new AiReportOrchestrator(
        provider,
        quota,
        buildConfig({ dailySessionLimit: 0 }),
        trackEvent as unknown as TrackAnalyticsEventUseCase,
      );

      await orchestrator.generate({
        source: ReportSource.FAKE,
        seed: 'seed-quota-disabled',
        sessionId: 'sess-anything',
        ipAddress: '203.0.113.11',
      });

      expect(provider.complete).toHaveBeenCalledTimes(1);
      // Only the IP scope was consumed because the session limit is disabled.
      expect(quota.consume).toHaveBeenCalledWith([
        { scope: 'ip', identifier: '203.0.113.11', limit: 200 },
      ]);
    });

    it('fails open when the quota adapter throws (Redis hiccup)', async () => {
      const provider = callableProvider('{"classification": "X"}');
      const flaky: AiQuotaPort = {
        consume: jest.fn(async () => {
          throw new Error('redis down');
        }),
      };
      const orchestrator = new AiReportOrchestrator(
        provider,
        flaky,
        buildConfig(),
        trackEvent as unknown as TrackAnalyticsEventUseCase,
      );

      await orchestrator.generate({
        source: ReportSource.FAKE,
        seed: 'seed-quota-failopen',
        sessionId: 'sess-x',
        ipAddress: '203.0.113.12',
      });

      // Quota adapter failed → request still went through to the provider.
      expect(provider.complete).toHaveBeenCalledTimes(1);
    });
  });
});
