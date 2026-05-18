import { BadRequestException } from '@nestjs/common';
import type { SponsorshipSlotCode } from './sponsorship-slots';
import {
  isSponsorshipSlotCode,
  SPONSORSHIP_SLOT_CODES,
} from './sponsorship-slots';

const BANNED_SUBSTRINGS = [
  'porn',
  'xxx',
  'nsfw',
  'slut',
  'rape',
  'nazi',
  'kill yourself',
  'kys',
] as const;

const MAX_LINE = 160;

function hasBannedContent(text: string): boolean {
  const t = text.toLowerCase();
  return BANNED_SUBSTRINGS.some((b) => t.includes(b));
}

function assertPlainString(v: unknown, field: string, max: number): string {
  if (typeof v !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  const s = v.trim();
  if (s.length === 0) {
    throw new BadRequestException(`${field} is required`);
  }
  if (s.length > max) {
    throw new BadRequestException(`${field} exceeds max length ${max}`);
  }
  if (hasBannedContent(s)) {
    throw new BadRequestException(`${field} failed brand safety review`);
  }
  return s;
}

function optionalString(v: unknown, field: string, max: number): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') {
    throw new BadRequestException(`${field} must be a string`);
  }
  const s = v.trim();
  if (s.length === 0) return undefined;
  if (s.length > max) {
    throw new BadRequestException(`${field} exceeds max length ${max}`);
  }
  if (hasBannedContent(s)) {
    throw new BadRequestException(`${field} failed brand safety review`);
  }
  return s;
}

function optionalUrl(v: unknown, field: string): string | undefined {
  const s = optionalString(v, field, 512);
  if (s === undefined) return undefined;
  if (!/^https:\/\//i.test(s)) {
    throw new BadRequestException(`${field} must be an https URL`);
  }
  return s;
}

/**
 * Validates creative_payload JSON per slot. Throws BadRequestException on policy violations.
 */
export function validateSponsorshipCreative(slotCode: string, raw: unknown): Record<string, unknown> {
  if (!isSponsorshipSlotCode(slotCode)) {
    throw new BadRequestException(`Unknown slot_code ${slotCode}`);
  }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BadRequestException('creative_payload must be a JSON object');
  }
  const o = raw as Record<string, unknown>;
  switch (slotCode) {
    case 'methane_index_powered_by': {
      const line = assertPlainString(o.line, 'line', MAX_LINE);
      const partnerMark = optionalString(o.partnerMark, 'partnerMark', 48);
      const disclosure = optionalString(o.disclosure, 'disclosure', MAX_LINE);
      const destinationUrl = optionalUrl(o.destinationUrl, 'destinationUrl');
      return { line, ...(partnerMark ? { partnerMark } : {}), ...(disclosure ? { disclosure } : {}), ...(destinationUrl ? { destinationUrl } : {}) };
    }
    case 'sponsored_badge': {
      const badgeId = assertPlainString(o.badgeId, 'badgeId', 64);
      const ribbonAppend = optionalString(o.ribbonAppend, 'ribbonAppend', 72);
      return { badgeId, ...(ribbonAppend ? { ribbonAppend } : {}) };
    }
    case 'sponsored_challenge': {
      const supportingLine = optionalString(o.supportingLine, 'supportingLine', MAX_LINE);
      const destinationUrl = optionalUrl(o.destinationUrl, 'destinationUrl');
      if (!supportingLine && !destinationUrl) {
        throw new BadRequestException('sponsored_challenge requires supportingLine and/or destinationUrl');
      }
      return { ...(supportingLine ? { supportingLine } : {}), ...(destinationUrl ? { destinationUrl } : {}) };
    }
    case 'sponsored_classification': {
      const targetVariantId = assertPlainString(o.targetVariantId, 'targetVariantId', 128);
      const ceremonialFootnote = assertPlainString(o.ceremonialFootnote, 'ceremonialFootnote', MAX_LINE);
      return { targetVariantId, ceremonialFootnote };
    }
    case 'sponsored_probable_cause': {
      const ceremonialLine = assertPlainString(o.ceremonialLine, 'ceremonialLine', MAX_LINE);
      return { ceremonialLine };
    }
    default: {
      const _exhaustive: never = slotCode;
      throw new BadRequestException(`Unhandled slot ${_exhaustive as string}`);
    }
  }
}

export function parseSlotCsv(raw: string | undefined): SponsorshipSlotCode[] {
  if (!raw || typeof raw !== 'string') return [...SPONSORSHIP_SLOT_CODES];
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out: SponsorshipSlotCode[] = [];
  for (const p of parts) {
    if (isSponsorshipSlotCode(p)) out.push(p);
  }
  return out.length > 0 ? out : [...SPONSORSHIP_SLOT_CODES];
}
