/** Anonymous public label for a gallery feed card (no session identity). */
export function formatGallerySpecimenLabel(submissionId: string): string {
  const hex = submissionId.replace(/-/g, '').slice(-8);
  const n = Number.parseInt(hex, 16);
  const code = Number.isFinite(n) ? (n % 9000) + 1000 : 1000;
  return `Specimen #${code}`;
}
