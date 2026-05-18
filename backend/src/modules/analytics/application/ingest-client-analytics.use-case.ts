import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TrackAnalyticsEventUseCase } from './track-analytics-event.use-case';
import { isClientAnalyticsEventName } from '../domain/client-analytics-catalog';

export interface ClientAnalyticsContext {
  sessionId: string | null;
  route: string;
  referrer: string | null;
  viewport: string;
  theme: string;
  reducedMotion: boolean;
}

export interface ClientAnalyticsRecordInput {
  name: string;
  payload: Record<string, unknown>;
  context: ClientAnalyticsContext;
  timestamp: number;
  iso: string;
  eventId?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseClientAnalyticsRecord(raw: unknown): ClientAnalyticsRecordInput {
  if (!isPlainObject(raw)) {
    throw new BadRequestException('Body must be a JSON object');
  }
  const name = raw.name;
  if (typeof name !== 'string' || !isClientAnalyticsEventName(name)) {
    throw new BadRequestException('Invalid or unknown analytics event name');
  }
  if (!isPlainObject(raw.payload)) {
    throw new BadRequestException('payload must be an object');
  }
  if (!isPlainObject(raw.context)) {
    throw new BadRequestException('context must be an object');
  }
  const ctx = raw.context;
  const sessionId =
    ctx.sessionId === null || ctx.sessionId === undefined
      ? null
      : typeof ctx.sessionId === 'string'
        ? ctx.sessionId
        : null;
  if (typeof ctx.route !== 'string') {
    throw new BadRequestException('context.route must be a string');
  }
  const referrer =
    ctx.referrer === null || ctx.referrer === undefined
      ? null
      : typeof ctx.referrer === 'string'
        ? ctx.referrer
        : null;
  if (typeof ctx.viewport !== 'string' || typeof ctx.theme !== 'string') {
    throw new BadRequestException('context.viewport and context.theme must be strings');
  }
  if (typeof ctx.reducedMotion !== 'boolean') {
    throw new BadRequestException('context.reducedMotion must be a boolean');
  }
  const timestamp = Number(raw.timestamp);
  if (!Number.isFinite(timestamp)) {
    throw new BadRequestException('timestamp must be a number');
  }
  if (typeof raw.iso !== 'string') {
    throw new BadRequestException('iso must be a string');
  }
  let eventId: string | undefined;
  if (raw.eventId !== undefined && raw.eventId !== null) {
    if (typeof raw.eventId !== 'string' || !UUID_RE.test(raw.eventId)) {
      throw new BadRequestException('eventId must be a UUID when provided');
    }
    eventId = raw.eventId;
  }
  return {
    name,
    payload: raw.payload,
    context: {
      sessionId,
      route: ctx.route,
      referrer,
      viewport: ctx.viewport,
      theme: ctx.theme,
      reducedMotion: ctx.reducedMotion,
    },
    timestamp,
    iso: raw.iso,
    ...(eventId !== undefined ? { eventId } : {}),
  };
}

export function parseClientAnalyticsBatch(raw: unknown): ClientAnalyticsRecordInput[] {
  if (!isPlainObject(raw)) {
    throw new BadRequestException('Body must be a JSON object');
  }
  const events = raw.events;
  if (!Array.isArray(events) || events.length === 0) {
    throw new BadRequestException('events must be a non-empty array');
  }
  if (events.length > 50) {
    throw new BadRequestException('events batch max size is 50');
  }
  return events.map((e) => parseClientAnalyticsRecord(e));
}

@Injectable()
export class IngestClientAnalyticsUseCase {
  private readonly logger = new Logger(IngestClientAnalyticsUseCase.name);

  constructor(private readonly trackEvent: TrackAnalyticsEventUseCase) {}

  async execute(backendSessionId: string | undefined, record: ClientAnalyticsRecordInput): Promise<void> {
    const payload: Record<string, unknown> = {
      ...record.payload,
      $client: {
        route: record.context.route,
        referrer: record.context.referrer,
        viewport: record.context.viewport,
        theme: record.context.theme,
        reducedMotion: record.context.reducedMotion,
        clientSessionId: record.context.sessionId,
        clientTimestamp: record.timestamp,
        clientIso: record.iso,
      },
    };

    try {
      await this.trackEvent.execute({
        sessionId: backendSessionId,
        eventType: record.name,
        payload,
        ...(record.eventId !== undefined ? { clientEventId: record.eventId } : {}),
        ingestSource: 'client',
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const code = (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code;
        if (code === '23505') {
          this.logger.debug({ eventId: record.eventId }, 'duplicate client analytics event ignored');
          return;
        }
      }
      throw error;
    }
  }
}
