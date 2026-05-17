/**
 * Audio privacy lifecycle (strategy alignment)
 *
 * Current Phase 3 behavior:
 * - Raw audio is stored on upload under a non-public storage key.
 * - Audio is NOT auto-deleted after report generation yet.
 *
 * TODO (when real AI processing ships):
 * - Default to deleting raw audio after successful analysis (processed_at set).
 * - Wire AUDIO_AUTO_DELETE_AFTER_PROCESSING env flag.
 * - Enqueue deletion job on analysis completion per "delete audio after analysis by default".
 *
 * Raw audio must never be exposed via public/signed URLs — backend-internal only.
 */
export const AUDIO_LIFECYCLE_PHASE = 3;
