const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

export function sanitizeFartmaxField(value: string, maxLength: number): string {
  const cleaned = value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim();
  if (cleaned.length === 0) return '';
  return cleaned.length <= maxLength ? cleaned : `${cleaned.slice(0, maxLength)}…`;
}

export type FartmaxVoteDirection = 'up' | 'down';

export function directionToDelta(direction: FartmaxVoteDirection): 1 | -1 {
  return direction === 'up' ? 1 : -1;
}
