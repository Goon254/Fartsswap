import { BadRequestException } from '@nestjs/common';
import { validateAudioUpload, validateDurationSeconds } from './audio-upload.validator';

describe('audio-upload.validator', () => {
  const base = {
    maxBytes: 1024,
    allowedMimeTypes: ['audio/webm', 'audio/ogg'],
  };

  it('rejects unsupported mime type', () => {
    expect(() =>
      { validateAudioUpload({ ...base, mimeType: 'audio/wav', sizeBytes: 100 }); },
    ).toThrow(BadRequestException);
  });

  it('rejects oversized files', () => {
    expect(() =>
      { validateAudioUpload({ ...base, mimeType: 'audio/webm', sizeBytes: 2048 }); },
    ).toThrow(BadRequestException);
  });

  it('accepts valid upload', () => {
    expect(() =>
      { validateAudioUpload({ ...base, mimeType: 'audio/webm', sizeBytes: 512 }); },
    ).not.toThrow();
  });

  it('rejects duration over 10 seconds', () => {
    expect(() => { validateDurationSeconds(11); }).toThrow(BadRequestException);
  });
});
