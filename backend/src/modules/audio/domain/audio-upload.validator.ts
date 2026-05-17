import { BadRequestException } from '@nestjs/common';

export interface AudioUploadValidationInput {
  mimeType: string;
  sizeBytes: number;
  maxBytes: number;
  allowedMimeTypes: string[];
}

export function validateAudioUpload(input: AudioUploadValidationInput): void {
  if (!input.allowedMimeTypes.includes(input.mimeType)) {
    throw new BadRequestException({
      message: 'Unsupported audio mime type',
      allowedMimeTypes: input.allowedMimeTypes,
      received: input.mimeType,
    });
  }

  if (input.sizeBytes <= 0) {
    throw new BadRequestException('Audio file is empty');
  }

  if (input.sizeBytes > input.maxBytes) {
    throw new BadRequestException({
      message: 'Audio file exceeds maximum allowed size',
      maxBytes: input.maxBytes,
      receivedBytes: input.sizeBytes,
    });
  }
}

/** Rough max duration guard: ~10s clips at typical bitrates stay under size cap. */
export function validateDurationSeconds(durationSeconds?: number): void {
  if (durationSeconds === undefined) {
    return;
  }
  if (durationSeconds <= 0 || durationSeconds > 10) {
    throw new BadRequestException({
      message: 'durationSeconds must be between 0 and 10',
      received: durationSeconds,
    });
  }
}
