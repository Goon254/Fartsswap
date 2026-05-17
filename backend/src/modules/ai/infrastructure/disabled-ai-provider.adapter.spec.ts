import { DisabledAiProviderAdapter } from './disabled-ai-provider.adapter';

describe('DisabledAiProviderAdapter', () => {
  const adapter = new DisabledAiProviderAdapter();

  it('declares itself non-callable', () => {
    expect(adapter.isCallable).toBe(false);
    expect(adapter.id).toBe('disabled');
    expect(adapter.model).toBe('disabled');
  });

  it('throws on any direct complete() call', async () => {
    await expect(
      adapter.complete({
        systemPrompt: 's',
        userPrompt: 'u',
        maxTokens: 10,
        temperature: 0.5,
        timeoutMs: 100,
      }),
    ).rejects.toThrow(/disabled/i);
  });
});
