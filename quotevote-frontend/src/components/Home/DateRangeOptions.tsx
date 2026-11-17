"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { QUICK_RANGES, quickRangeDates } from "@/lib/utils/homeDates";

const QUICK =
  "h-8 cursor-pointer rounded-[9px] border-[length:var(--shell-border-w)] border-[var(--shell-key-line)] bg-[var(--shell-surface)] px-[11px] text-[12.5px] font-semibold text-[var(--shell-ink-2)] hover:bg-[var(--shell-hover)]";
const QUICK_ON =
  "border-[var(--shell-blue)] bg-[var(--shell-blue-soft)] font-bold text-[var(--shell-blue-ink)] hover:bg-[var(--shell-blue-soft)]";
const DATE_INPUT =
  "h-9 w-[170px] min-w-0 rounded-[9px] border-[length:var(--shell-border-w)] border-[var(--shell-key-line)] bg-[var(--shell-surface)] px-2 text-[12.5px] text-[var(--shell-ink)] dark:[color-scheme:dark]";

/** Past day, week or month, or a custom From and To. */
export function DateRangeOptions({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const fromId = useId();
  const toId = useId();

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        {QUICK_RANGES.map((range) => {
          const dates = quickRangeDates(range);
          const on = from === dates.from && to === dates.to;
          return (
            <button
              key={range.key}
              type="button"
              aria-pressed={on}
              onClick={() => (on ? onChange("", "") : onChange(dates.from, dates.to))}
              className={cn(QUICK, on && QUICK_ON)}
            >
              {range.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={fromId}
          className="flex items-center justify-between gap-3 text-xs font-bold text-[var(--shell-muted)]"
        >
          From
          <input
            id={fromId}
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => onChange(e.target.value, to)}
            className={DATE_INPUT}
          />
        </label>
        <label
          htmlFor={toId}
          className="flex items-center justify-between gap-3 text-xs font-bold text-[var(--shell-muted)]"
        >
          To
          <input
            id={toId}
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => onChange(from, e.target.value)}
            className={DATE_INPUT}
          />
        </label>
      </div>
    </div>
  );
}
