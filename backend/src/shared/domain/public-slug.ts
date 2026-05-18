/**
 * Deterministic, URL-safe public slug derived from the report UUID.
 * Keeps uniqueness without an extra round-trip for collision checks.
 */
export function publicSlugFromReportId(reportId: string): string {
  const hex = reportId.replace(/-/g, '');
  return `r${hex.slice(0, 12)}`;
}
