import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProviderPort,
} from '../../../shared/application/ports/ai-provider.port';

interface ChatChoice {
  message?: { content?: string | null };
  finish_reason?: string;
}

interface ChatCompletionResponse {
  choices?: ChatChoice[];
  model?: string;
}

/**
 * OpenAI-compatible chat-completion adapter.
 *
 * Works against any provider that exposes the OpenAI `/chat/completions`
 * surface (real OpenAI, Azure OpenAI with route compat, Together, Groq,
 * vLLM, llama.cpp-server, etc.) by configuring `AI_BASE_URL`.
 *
 * Network call is bounded by `AI_TIMEOUT_MS` (AbortController) and a small
 * bounded retry budget (`AI_MAX_RETRIES`) for transient 5xx / network errors
 * only. The adapter MUST NOT log prompts or raw response text in product
 * analytics; structured debug logging is gated by `AI_DEBUG_LOG`.
 */
@Injectable()
export class OpenAiProviderAdapter implements AiProviderPort {
  private readonly logger = new Logger(OpenAiProviderAdapter.name);
  readonly id = 'openai';

  constructor(private readonly config: AppConfigService) {}

  get isCallable(): boolean {
    return this.config.ai.callable;
  }

  get model(): string {
    return this.config.ai.model;
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const cfg = this.config.ai;
    if (!cfg.callable) {
      throw new Error('OpenAI adapter called while AI is not configured (callable=false).');
    }

    const url = `${trimTrailingSlash(cfg.baseUrl)}/chat/completions`;
    const body = {
      model: cfg.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      // Ask for JSON mode where the server supports it. Servers that don't
      // recognise the field ignore it, and we re-validate downstream anyway.
      response_format: { type: 'json_object' },
    };

    const attempts = cfg.maxRetries + 1;
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const started = Date.now();
      try {
        const text = await this.callOnce(url, body, request.timeoutMs, cfg.apiKey ?? '');
        const latencyMs = Date.now() - started;
        if (cfg.debugLog) {
          this.logger.debug(
            {
              provider: this.id,
              model: cfg.model,
              attempt,
              latencyMs,
              responseChars: text.length,
            },
            'ai.completion ok',
          );
        }
        return {
          text,
          provider: this.id,
          model: cfg.model,
          latencyMs,
        };
      } catch (error) {
        const latencyMs = Date.now() - started;
        lastError = error;
        const transient = isTransient(error);
        if (cfg.debugLog) {
          this.logger.debug(
            {
              provider: this.id,
              model: cfg.model,
              attempt,
              latencyMs,
              transient,
              err: error instanceof Error ? error.message : 'unknown',
            },
            'ai.completion failed',
          );
        }
        if (!transient || attempt === attempts) break;
        // Small fixed backoff before retry; bounded by AI_MAX_RETRIES anyway.
        await sleep(150 * attempt);
      }
    }
    throw lastError instanceof Error ? lastError : new Error('AI completion failed');
  }

  private async callOnce(
    url: string,
    body: unknown,
    timeoutMs: number,
    apiKey: string,
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new AiTimeoutError(timeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const status = response.status;
      const snippet = (await safeText(response)).slice(0, 200);
      throw new AiHttpError(status, snippet);
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const first = payload.choices?.[0];
    const content = first?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      throw new Error('AI provider returned empty completion');
    }
    return content;
  }
}

export class AiTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`AI completion timed out after ${timeoutMs}ms`);
    this.name = 'AiTimeoutError';
  }
}

export class AiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly bodySnippet: string,
  ) {
    super(`AI provider HTTP ${status}: ${bodySnippet}`);
    this.name = 'AiHttpError';
  }
}

function isTransient(error: unknown): boolean {
  if (error instanceof AiTimeoutError) return true;
  if (error instanceof AiHttpError) {
    if (error.status === 408 || error.status === 429) return true;
    if (error.status >= 500 && error.status < 600) return true;
    return false;
  }
  // fetch network errors throw TypeError in Node 22; treat as transient.
  if (error instanceof TypeError) return true;
  return false;
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

async function safeText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
