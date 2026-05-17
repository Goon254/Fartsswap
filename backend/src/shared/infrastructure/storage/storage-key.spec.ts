import { BadRequestException } from '@nestjs/common';
import { resolve } from 'path';
import { resolveStorageKey } from './storage-key';

describe('resolveStorageKey', () => {
  const base = resolve('/tmp/farts-test-storage');

  it('resolves a clean nested key inside the base', () => {
    const out = resolveStorageKey(base, 'audio/raw/sess-1/abc.webm');
    expect(out).toBe(resolve(base, 'audio/raw/sess-1/abc.webm'));
    expect(out.startsWith(base)).toBe(true);
  });

  it('rejects parent traversal via ..', () => {
    expect(() => resolveStorageKey(base, '../escape.txt')).toThrow(BadRequestException);
    expect(() => resolveStorageKey(base, 'audio/../../escape.txt')).toThrow(BadRequestException);
  });

  it('rejects absolute paths', () => {
    expect(() => resolveStorageKey(base, '/etc/passwd')).toThrow(BadRequestException);
  });

  it('rejects null bytes', () => {
    expect(() => resolveStorageKey(base, 'audio/raw/file\0.txt')).toThrow(BadRequestException);
  });

  it('rejects URL-style keys', () => {
    expect(() => resolveStorageKey(base, 'http://evil.com/x')).toThrow(BadRequestException);
    expect(() => resolveStorageKey(base, 'file:///etc/hosts')).toThrow(BadRequestException);
  });

  it('rejects empty keys', () => {
    expect(() => resolveStorageKey(base, '')).toThrow(BadRequestException);
  });
});
