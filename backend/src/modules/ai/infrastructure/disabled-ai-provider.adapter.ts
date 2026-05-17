import { Injectable } from '@nestjs/common';
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProviderPort,
} from '../../../shared/application/ports/ai-provider.port';

/**
 * Bound when `AI_ENABLED=false` or the provider is intentionally off.
 *
 * `isCallable` is `false`, so the orchestrator skips the network call entirely
 * and routes to the deterministic fallback without paying any latency cost.
 * `complete()` is implemented for safety: if some future caller bypasses the
 * `isCallable` guard, the call throws a clear error rather than hanging.
 */
@Injectable()
export class DisabledAiProviderAdapter implements AiProviderPort {
  readonly isCallable = false;
  readonly id = 'disabled';
  readonly model = 'disabled';

  complete(_request: AiCompletionRequest): Promise<AiCompletionResponse> {
    return Promise.reject(
      new Error(
        'AI provider is disabled (AI_ENABLED=false or AI_PROVIDER not configured). ' +
          'The orchestrator should route to the deterministic fallback instead of calling complete().',
      ),
    );
  }
}
