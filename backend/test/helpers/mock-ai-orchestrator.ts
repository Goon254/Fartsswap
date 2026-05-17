import { ReportSource } from '../../src/shared/domain/types';
import type {
  AiReportFields,
  AiReportRequest,
  AiReportResult,
} from '../../src/modules/ai/domain/ai-report.types';
import type { AiReportOrchestrator } from '../../src/modules/ai/application/ai-report.orchestrator';

/**
 * Test double for `AiReportOrchestrator`.
 *
 * Use `fakeOrchestrator()` for the common case (returns deterministic
 * fallback-style fields). Use `fakeOrchestrator({ ... })` to override
 * specific fields or meta. The returned object also exposes `lastRequest`
 * for assertions on what the use case sent.
 */
export interface FakeOrchestrator {
  generate: jest.Mock<Promise<AiReportResult>, [AiReportRequest]>;
  lastRequest: () => AiReportRequest | undefined;
}

export function fakeOrchestrator(
  fields?: Partial<AiReportFields>,
  meta?: Partial<AiReportResult['meta']>,
): AiReportOrchestrator & FakeOrchestrator {
  const calls: AiReportRequest[] = [];
  const generate = jest.fn(async (request: AiReportRequest): Promise<AiReportResult> => {
    calls.push(request);
    return {
      fields: {
        fartName: 'Test Emission',
        classification: 'Silent Assassin',
        powerScore: 42,
        durationMs: request.durationSeconds ? Math.round(request.durationSeconds * 1000) : 1234,
        emotionalTone: 'Clinically unnecessary',
        probableCause: 'Late-night legume symposium',
        cinematicParallel: 'A deleted scene from a courtroom drama',
        threatLevel: 'Amber',
        shortSummary: 'A measured emission of theatrical significance.',
        reportHash: `fart_${'a'.repeat(16)}`,
        ...fields,
      },
      meta: {
        source: 'model',
        provider: 'openai',
        model: 'gpt-4o-mini',
        latencyMs: 25,
        fallbackUsed: false,
        ...meta,
      },
    };
  });

  return {
    generate,
    lastRequest: () => calls.at(-1),
    // Cast through unknown — the real class has private fields the mock omits.
  } as unknown as AiReportOrchestrator & FakeOrchestrator;
}

export const TEST_REPORT_SOURCE = {
  FAKE: ReportSource.FAKE,
  AUDIO: ReportSource.AUDIO_RECORDING,
};
