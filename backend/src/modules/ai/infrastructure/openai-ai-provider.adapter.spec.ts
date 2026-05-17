import type { AppConfigService } from '../../../config/config.service';
import {
  AiHttpError,
  AiTimeoutError,
  OpenAiProviderAdapter,
} from './openai-ai-provider.adapter';

function buildConfig(overrides?: Partial<AppConfigService['ai']>): AppConfigService {
  return {
    ai: {
      enabled: true,
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.test/v1',
      model: 'gpt-4o-mini',
      timeoutMs: 50,
      maxTokens: 100,
      temperature: 0.5,
      maxRetries: 1,
      debugLog: false,
      callable: true,
      ...overrides,
    },
  } as unknown as AppConfigService;
}

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
});

describe('OpenAiProviderAdapter', () => {
  it('refuses to dial when AI is not callable', async () => {
    const adapter = new OpenAiProviderAdapter(
      buildConfig({ callable: false, enabled: false, provider: 'disabled' }),
    );
    await expect(
      adapter.complete({
        systemPrompt: 'sys',
        userPrompt: 'usr',
        maxTokens: 10,
        temperature: 0.5,
        timeoutMs: 50,
      }),
    ).rejects.toThrow(/not configured/i);
  });

  it('sends a POST with bearer auth + system/user messages and returns text', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          model: 'gpt-4o-mini',
          choices: [{ message: { content: '{"classification": "X"}' } }],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    globalThis.fetch = fetchMock;

    const adapter = new OpenAiProviderAdapter(buildConfig());
    const out = await adapter.complete({
      systemPrompt: 'system prompt',
      userPrompt: 'user prompt',
      maxTokens: 100,
      temperature: 0.7,
      timeoutMs: 50,
    });

    expect(out.text).toBe('{"classification": "X"}');
    expect(out.provider).toBe('openai');
    expect(out.model).toBe('gpt-4o-mini');

    const firstCall = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstCall[0]).toBe('https://api.openai.test/v1/chat/completions');
    const headers = firstCall[1].headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer sk-test');
    const body = JSON.parse(firstCall[1].body as string) as Record<string, unknown>;
    expect(body.model).toBe('gpt-4o-mini');
    const messages = body.messages as { role: string }[];
    expect(messages[0]?.role).toBe('system');
    expect(messages[1]?.role).toBe('user');
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('throws AiHttpError on non-2xx', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(new Response('upstream boom', { status: 502 }));
    globalThis.fetch = fetchMock;

    const adapter = new OpenAiProviderAdapter(buildConfig({ maxRetries: 0 }));
    await expect(
      adapter.complete({
        systemPrompt: 's',
        userPrompt: 'u',
        maxTokens: 10,
        temperature: 0.5,
        timeoutMs: 50,
      }),
    ).rejects.toBeInstanceOf(AiHttpError);
  });

  it('maps abort signal to AiTimeoutError', async () => {
    const fetchMock = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal;
      return new Promise<Response>((_resolve, reject) => {
        if (signal) {
          signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    });
    globalThis.fetch = fetchMock;

    const adapter = new OpenAiProviderAdapter(buildConfig({ maxRetries: 0, timeoutMs: 10 }));
    await expect(
      adapter.complete({
        systemPrompt: 's',
        userPrompt: 'u',
        maxTokens: 10,
        temperature: 0.5,
        timeoutMs: 10,
      }),
    ).rejects.toBeInstanceOf(AiTimeoutError);
  });

  it('retries on transient 5xx up to AI_MAX_RETRIES', async () => {
    const okResponse = new Response(
      JSON.stringify({
        model: 'gpt-4o-mini',
        choices: [{ message: { content: '{"classification": "Y"}' } }],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response('upstream', { status: 503 }))
      .mockResolvedValueOnce(okResponse);
    globalThis.fetch = fetchMock;

    const adapter = new OpenAiProviderAdapter(buildConfig({ maxRetries: 1 }));
    const out = await adapter.complete({
      systemPrompt: 's',
      userPrompt: 'u',
      maxTokens: 10,
      temperature: 0.5,
      timeoutMs: 50,
    });
    expect(out.text).toContain('"Y"');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on 4xx (non-429)', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(new Response('bad request', { status: 400 }));
    globalThis.fetch = fetchMock;

    const adapter = new OpenAiProviderAdapter(buildConfig({ maxRetries: 3 }));
    await expect(
      adapter.complete({
        systemPrompt: 's',
        userPrompt: 'u',
        maxTokens: 10,
        temperature: 0.5,
        timeoutMs: 50,
      }),
    ).rejects.toBeInstanceOf(AiHttpError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
