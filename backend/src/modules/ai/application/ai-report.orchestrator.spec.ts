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

function buildConfig(overrides?: Partial<AppConfigService['ai']>): AppConfigService {
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
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({
      source: ReportSource.FAKE,
      customFartName: 'Velvet Decree',
      seed: 'seed-happy',
    });

    expect(result.meta.source).toBe('model');
    expect(result.meta.fallbackUsed).toBe(false);
    expect(result.fields.fartName).toBe('Velvet Decree');
    expect(result.fields.reportHash).toMatch(/^fart_[a-f0-9]{16}$/);
    expect(provider.complete).toHaveBeenCalledTimes(1);

    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: AnalyticsEventType.AI_REPORT_REQUESTED }),
    );
    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AnalyticsEventType.AI_REPORT_SUCCEEDED,
        payload: expect.objectContaining({
          provider: 'openai',
          fallbackUsed: false,
        }),
      }),
    );
  });

  it('falls back when the provider is not callable (AI disabled)', async () => {
    const provider = disabledProvider();
    const orchestrator = new AiReportOrchestrator(
      provider,
      buildConfig({ enabled: false, callable: false, provider: 'disabled' }),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({
      source: ReportSource.FAKE,
      seed: 'seed-off',
    });

    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.meta.source).toBe('fallback');
    expect(result.meta.provider).toBe('deterministic');
    expect(result.meta.fallbackReason).toBe('provider_not_callable');
    expect(provider.complete).not.toHaveBeenCalled();

    expect(trackEvent.trackBestEffort).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AnalyticsEventType.AI_REPORT_FAILED,
        payload: expect.objectContaining({
          fallbackUsed: true,
          reason: 'provider_not_callable',
        }),
      }),
    );
  });

  it('falls back when the model returns invalid JSON', async () => {
    const provider = callableProvider('I refuse to comply.');
    const orchestrator = new AiReportOrchestrator(
      provider,
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({
      source: ReportSource.FAKE,
      seed: 'seed-bad-json',
    });

    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.meta.fallbackReason).toBe('parse_not_json');
    expect(result.fields.fartName.length).toBeGreaterThan(0);
  });

  it('falls back when the provider call throws (timeout / network)', async () => {
    const err = new Error('AI completion timed out after 1000ms');
    err.name = 'AiTimeoutError';
    const provider = failingProvider(err);
    const orchestrator = new AiReportOrchestrator(
      provider,
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
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    const result = await orchestrator.generate({ source: ReportSource.FAKE, seed: 'seed-unsafe' });

    // Source is still 'model' (parsing succeeded), but each unsafe field is
    // replaced by the per-field fallback during normalisation.
    expect(result.meta.source).toBe('model');
    expect(result.fields.fartName).not.toMatch(/sex/i);
    expect(result.fields.probableCause).not.toMatch(/kill yourself/i);
    expect(result.fields.emotionalTone).not.toMatch(/porn/i);
  });

  it('never includes prompts or raw responses in analytics payloads', async () => {
    const provider = callableProvider('{"classification": "X"}');
    const orchestrator = new AiReportOrchestrator(
      provider,
      buildConfig(),
      trackEvent as unknown as TrackAnalyticsEventUseCase,
    );

    await orchestrator.generate({ source: ReportSource.FAKE, seed: 'seed-no-prompt' });

    for (const call of trackEvent.trackBestEffort.mock.calls) {
      const payload = JSON.stringify(call[0]);
      expect(payload).not.toMatch(/system|user|prompt|raw|completion|chat/i);
    }
  });
});
