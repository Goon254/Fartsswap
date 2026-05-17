import { Injectable } from '@nestjs/common';
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProviderPort,
} from '../../../shared/application/ports/ai-provider.port';

/**
 * Legacy stub adapter retained for backwards compatibility with the original
 * Phase 1 wiring. Behaves like `DisabledAiProviderAdapter`: `isCallable` is
 * false so the orchestrator never reaches `complete()`. Selecting
 * `AI_PROVIDER=stub` is effectively the same as `AI_PROVIDER=disabled`.
 */
@Injectable()
export class StubAiProviderAdapter implements AiProviderPort {
  readonly isCallable = false;
  readonly id = 'stub';
  readonly model = 'stub';

  complete(_request: AiCompletionRequest): Promise<AiCompletionResponse> {
    return Promise.reject(
      new Error(
        'Stub AI provider does not implement completion. Use AI_PROVIDER=openai with a real key, ' +
          'or rely on the orchestrator deterministic fallback.',
      ),
    );
  }
}
