import type { ArchivalNoteDto, RitualTeaserItemDto } from '../interface/http/dto/methane-index.dto';

/** Ceremonial tail — mostly static until archive products ship. */
export const DEFAULT_RITUAL_TEASERS: readonly RitualTeaserItemDto[] = [
  {
    id: 'fart_wrapped',
    code: 'RITUAL · ANNUAL',
    title: 'Fart Wrapped',
    body: 'Year-end ceremonial review of each citizen\u2019s personal acoustic ledger. Designations of merit issued to long-tenured filers.',
    hint: 'COMPILES · WEEK 52 \u00B7 MMXXVI',
    href: '/fart-wrapped',
    available: true,
  },
  {
    id: 'all_time_archive',
    code: 'RITUAL · ARCHIVE',
    title: 'All-Time Classification Archive',
    body: 'Browse historic classification movement back to the inaugural issue. Currently held under §0.1 of the Release Provision.',
    hint: 'OPENS WITH PUBLIC FILING LINE',
    available: false,
  },
  {
    id: 'methane_almanac',
    code: 'RITUAL · SUBSCRIPTION',
    title: 'Methane Almanac',
    body: 'Weekly delivery of the Index direct to your correspondence channel. Includes the full classification movers ledger.',
    hint: 'OPENS POST-LAUNCH',
    available: false,
  },
];

export const DEFAULT_ARCHIVAL_NOTES: readonly ArchivalNoteDto[] = [
  { id: 'an_a', label: 'ISSUANCE MODE', value: 'Query-backed bulletin · provisional national ledger' },
  { id: 'an_b', label: 'DATA WINDOW', value: 'Rolling 7-day UTC filing cohort vs prior 7-day window' },
  { id: 'an_c', label: 'REVIEW STATUS', value: 'Automated aggregation · human editorial layer reserved' },
];
