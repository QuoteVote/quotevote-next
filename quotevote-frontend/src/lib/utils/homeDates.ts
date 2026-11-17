import type { QuickRange } from "@/types/home";

export const QUICK_RANGES: QuickRange[] = [
  { key: "day", label: "Past day", days: 1 },
  { key: "week", label: "Past week", days: 7 },
  { key: "month", label: "Past month", days: 30 },
];

/** `YYYY-MM-DD` in the viewer's time zone, the format the date filter uses. */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The from/to pair for a quick range ending today. */
export function quickRangeDates(
  range: QuickRange,
  now: Date = new Date()
): {
  from: string;
  to: string;
} {
  const start = new Date(now);
  start.setDate(start.getDate() - range.days);
  return { from: toLocalIsoDate(start), to: toLocalIsoDate(now) };
}
