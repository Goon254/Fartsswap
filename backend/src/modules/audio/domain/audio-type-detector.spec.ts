import { detectAudioType } from './audio-type-detector';

describe('detectAudioType', () => {
  it('detects WebM/Matroska via EBML magic + doctype', () => {
    const buf = Buffer.concat([
      Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
      Buffer.from('webm'),
      Buffer.alloc(8, 0),
    ]);
    const result = detectAudioType(buf);
    expect(result).toEqual({ mimeType: 'audio/webm', container: 'webm' });
  });

  it('detects Ogg via OggS magic', () => {
    const buf = Buffer.concat([Buffer.from('OggS'), Buffer.alloc(64, 0)]);
    expect(detectAudioType(buf)).toEqual({ mimeType: 'audio/ogg', container: 'ogg' });
  });

  it('detects MP3 via ID3 tag', () => {
    const buf = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(64, 0)]);
    expect(detectAudioType(buf)).toEqual({ mimeType: 'audio/mpeg', container: 'mp3' });
  });

  it('detects MP3 via MPEG-1 Layer III frame sync (0xFF 0xFB)', () => {
    const buf = Buffer.concat([Buffer.from([0xff, 0xfb]), Buffer.alloc(64, 0)]);
    expect(detectAudioType(buf)).toEqual({ mimeType: 'audio/mpeg', container: 'mp3' });
  });

  it('rejects plain text masquerading as audio/webm', () => {
    const buf = Buffer.from('hello world this is not audio');
    expect(detectAudioType(buf)).toBeNull();
  });

  it('rejects empty / short buffers', () => {
    expect(detectAudioType(Buffer.alloc(0))).toBeNull();
    expect(detectAudioType(Buffer.from([0x1a, 0x45]))).toBeNull();
  });

  it('rejects EBML header without webm/matroska doctype (generic Matroska variant)', () => {
    const buf = Buffer.concat([
      Buffer.from([0x1a, 0x45, 0xdf, 0xa3]),
      Buffer.from('something-else'),
      Buffer.alloc(8, 0),
    ]);
    expect(detectAudioType(buf)).toBeNull();
  });

  it('does not confuse arbitrary 0xFF bytes for MP3', () => {
    const buf = Buffer.from([0xff, 0x00, 0x00, 0x00]);
    expect(detectAudioType(buf)).toBeNull();
  });
});
