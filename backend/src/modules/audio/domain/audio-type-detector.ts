/**
 * Server-side magic-byte detector for audio uploads.
 *
 * The client-supplied multipart `Content-Type` is untrusted; this module
 * inspects the actual bytes to confirm the file is one of the supported audio
 * containers. Detection covers the three formats the upload pipeline
 * currently allows: WebM/Matroska, Ogg, and MP3.
 *
 * Intentionally dependency-free to avoid heavy native modules. The detector
 * returns a canonical MIME type that callers should prefer over the
 * client-supplied one.
 */

export type DetectedAudioType = 'audio/webm' | 'audio/ogg' | 'audio/mpeg';

export interface AudioDetectionResult {
  /** Canonical MIME type derived from magic bytes. */
  mimeType: DetectedAudioType;
  /** Short container identifier for logging. */
  container: 'webm' | 'ogg' | 'mp3';
}

const EBML_MAGIC = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const OGG_MAGIC = Buffer.from('OggS', 'ascii');
const ID3_MAGIC = Buffer.from('ID3', 'ascii');

export function detectAudioType(buffer: Buffer): AudioDetectionResult | null {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return null;
  }

  if (buffer.subarray(0, 4).equals(EBML_MAGIC) && isMatroskaWebm(buffer)) {
    return { mimeType: 'audio/webm', container: 'webm' };
  }

  if (buffer.subarray(0, 4).equals(OGG_MAGIC)) {
    return { mimeType: 'audio/ogg', container: 'ogg' };
  }

  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(ID3_MAGIC)) {
    return { mimeType: 'audio/mpeg', container: 'mp3' };
  }

  if (isMpegFrameSync(buffer)) {
    return { mimeType: 'audio/mpeg', container: 'mp3' };
  }

  return null;
}

/**
 * Scan a small window of the EBML header for the DocType string. WebM is the
 * specific Matroska variant we accept for browser MediaRecorder output.
 */
function isMatroskaWebm(buffer: Buffer): boolean {
  const headerWindow = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('binary');
  return headerWindow.includes('webm') || headerWindow.includes('matroska');
}

/**
 * MPEG-1/2 Layer III frame sync: two bytes where the first is 0xFF and the
 * top three bits of the second are set. Restrict the version/layer nibble to
 * the values produced by real MP3 encoders to keep false positives low.
 *
 * - 0xFA / 0xFB: MPEG-1 Layer III
 * - 0xF2 / 0xF3: MPEG-2 Layer III
 */
function isMpegFrameSync(buffer: Buffer): boolean {
  if (buffer.length < 2) {
    return false;
  }
  if (buffer[0] !== 0xff) {
    return false;
  }
  const b1 = buffer[1];
  return b1 === 0xfa || b1 === 0xfb || b1 === 0xf2 || b1 === 0xf3;
}
