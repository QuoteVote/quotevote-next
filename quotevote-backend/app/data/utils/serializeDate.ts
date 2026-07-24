/**
 * Normalize Date / epoch / date-string values to ISO-8601 for GraphQL String fields.
 * Always returns a string (empty when invalid) so clients can treat dates as strings.
 */
export function toIsoDateString(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Seconds vs milliseconds (Unix seconds are < 1e12 until year ~33658).
    const ms = value > 0 && value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return toIsoDateString(Number(trimmed));
    }
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  return '';
}
