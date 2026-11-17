"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ColorSwatchesProps } from "@/types/avatar";

/** A radio group of labeled color dots. Arrow keys move and pick. */
export function ColorSwatches(props: ColorSwatchesProps): ReactNode {
  const { label, options, value, onChange, size = 36 } = props;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.findIndex((o) => o.value === value);
  const tabStop = selected >= 0 ? selected : 0;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    const jump = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : null;
    if (delta === undefined && jump === null) return;
    event.preventDefault();
    const next = jump ?? (index + (delta ?? 0) + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-x-2.5 gap-y-3.5">
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.label}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="flex w-[62px] cursor-pointer flex-col items-center gap-1.5 rounded-lg border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2457E6]"
          >
            <span
              aria-hidden="true"
              className={cn(
                "block rounded-full shadow-[inset_0_0_0_1px_rgba(15,23,42,0.14)] outline-2 outline-offset-[3px]",
                checked ? "outline-[var(--ae-green)]" : "outline-transparent"
              )}
              style={{ width: size, height: size, background: option.hex }}
            />
            <span
              className={cn(
                "whitespace-nowrap text-[11.5px]",
                checked
                  ? "font-bold text-[var(--ae-green-ink)]"
                  : "font-semibold text-[var(--ae-muted)]"
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
