import type { AudioUpload } from '../../../../shared/domain/models';

export interface AudioUploadRepository {
  save(upload: AudioUpload): Promise<void>;
  update(upload: AudioUpload): Promise<void>;
  findById(id: string): Promise<AudioUpload | null>;
}

export const AUDIO_UPLOAD_REPOSITORY = Symbol('AUDIO_UPLOAD_REPOSITORY');
