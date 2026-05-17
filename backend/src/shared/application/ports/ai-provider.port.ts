/**
 * Provider-agnostic AI port.
 *
 * The orchestrator builds a prompt with `system` + `user` messages and asks
 * the provider for a JSON-only completion. Concrete adapters (OpenAI, etc.)
 * implement `complete`. The legacy `analyze` API is kept around to avoid a
 * breaking change for any caller that still references it, but the report
 * orchestrator only uses `complete`.
 */

export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  /** Soft maximum on response tokens. */
  maxTokens: number;
  /** 0–2; higher = more creative. */
  temperature: number;
  /** Per-call deadline; the adapter must abort the network call if exceeded. */
  timeoutMs: number;
}

export interface AiCompletionResponse {
  /** Raw text content of the model's first choice. */
  text: string;
  /** Logical provider id (e.g. 'openai'). */
  provider: string;
  /** Model id used (e.g. 'gpt-4o-mini'). */
  model: string;
  /** Round-trip wall time in milliseconds. */
  latencyMs: number;
}

export interface AiAnalysisInput {
  durationMs?: number;
  tonePreset?: string;
  customFartName?: string;
}

export interface AiAnalysisResult {
  classification: string;
  powerScore: number;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  threatLevel: string;
}

export interface AiProviderPort {
  /** True when the adapter can actually reach a model. */
  readonly isCallable: boolean;
  /** Returns the logical provider id (e.g. 'openai', 'disabled'). */
  readonly id: string;
  /** Returns the model id this adapter will use. */
  readonly model: string;

  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;

  /** Deprecated — kept for backwards compatibility; new code should use complete(). */
  analyze?(input: AiAnalysisInput): Promise<AiAnalysisResult>;
}

export const AI_PROVIDER_PORT = Symbol('AI_PROVIDER_PORT');
