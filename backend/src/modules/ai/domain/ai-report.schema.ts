import { z } from 'zod';

/**
 * Zod schema for the JSON object the model is asked to return.
 *
 * Everything is `optional()` at the schema layer because the model will
 * occasionally drop fields; the validator layer (`output-validator.ts`)
 * fills missing values with safe defaults rather than throwing. Only the
 * top-level type (object) is hard-required.
 *
 * Length caps here are deliberately generous; the safety filter then
 * truncates further to the per-field caps that fit the share card.
 */
export const aiReportModelSchema = z
  .object({
    fartName: z.string().max(120).optional(),
    classification: z.string().max(80).optional(),
    powerScore: z.number().finite().optional(),
    emotionalTone: z.string().max(120).optional(),
    probableCause: z.string().max(200).optional(),
    cinematicParallel: z.string().max(200).optional(),
    threatLevel: z.string().max(40).optional(),
    shortSummary: z.string().max(300).optional(),
    // The model may suggest a hash, but the server generates the final one.
    reportHash: z.string().max(80).optional(),
    genre: z.string().max(60).optional(),
    confidenceLabel: z.string().max(40).optional(),
    warningBadge: z.string().max(40).optional(),
  })
  .passthrough();

export type AiReportModelOutput = z.infer<typeof aiReportModelSchema>;

/** Strict caps applied AFTER the model output is parsed and sanitised. */
export const FIELD_CAPS = {
  fartName: 60,
  classification: 40,
  emotionalTone: 60,
  probableCause: 120,
  cinematicParallel: 120,
  shortSummary: 180,
  genre: 40,
  confidenceLabel: 24,
  warningBadge: 24,
} as const;
