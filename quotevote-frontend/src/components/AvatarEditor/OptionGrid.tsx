"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { AvatarCropImage } from "@/components/AvatarEditor/AvatarArt";
import { cn } from "@/lib/utils";
import type { OptionGridProps, OptionTileProps } from "@/types/avatar";

const KEY_STEP: Record<string, (cols: number) => number> = {
  ArrowRight: () => 1,
  ArrowDown: (cols) => cols,
  ArrowLeft: () => -1,
  ArrowUp: (cols) => -cols,
};

/** Columns the grid currently renders, so Up/Down move by one row at any width. */
export function gridColumns(node: HTMLElement | null): number {
  if (!node || typeof window === "undefined") return 1;
  const template = window.getComputedStyle(node).gridTemplateColumns;
  const count = template ? template.split(" ").filter(Boolean).length : 1;
  return Math.max(1, count);
}

/**
 * A radio group of picture tiles. Arrow keys move and pick (Up/Down by row),
 * Home/End jump to the ends; only the picked tile is in the tab order.
 */
export function OptionGrid(props: OptionGridProps): ReactNode {
  const { label, items, value, onChange, crop, height, colsClassName } = props;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const groupRef = useRef<HTMLDivElement>(null);
  const selected = items.findIndex((item) => item.value === value);
  const tabStop = selected >= 0 ? selected : 0;

  const move = (to: number): void => {
    const index = Math.max(0, Math.min(items.length - 1, to));
    const item = items[index];
    if (!item) return;
    onChange(item.value);
    refs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const step = KEY_STEP[event.key];
    if (step) {
      event.preventDefault();
      move(index + step(gridColumns(groupRef.current)));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      move(event.key === "Home" ? 0 : items.length - 1);
    }
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-2.5", colsClassName)}
    >
      {items.map((item, index) => (
        <OptionTile
          key={item.value}
          item={item}
          checked={item.value === value}
          tabIndex={index === tabStop ? 0 : -1}
          crop={crop}
          height={height}
          accent={props.accent ?? "green"}
          onSelect={() => onChange(item.value)}
          onKeyDown={(event) => onKeyDown(event, index)}
          register={(node) => {
            refs.current[index] = node;
          }}
        />
      ))}
    </div>
  );
}

function OptionTile({
  item,
  checked,
  tabIndex,
  crop,
  height,
  accent,
  onSelect,
  onKeyDown,
  register,
}: OptionTileProps): ReactNode {
  const ring =
    accent === "blue"
      ? "border-[#2457E6] shadow-[0_0_0_1px_#2457E6]"
      : "border-[var(--ae-green)] shadow-[0_0_0_1px_var(--ae-green)]";
  return (
    <button
      ref={register}
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabIndex}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "relative flex min-w-0 cursor-pointer flex-col items-stretch gap-1.5 rounded-xl border bg-[var(--ae-surface)] px-1.5 pt-1.5 pb-2 text-center transition-colors",
        "border-[var(--ae-line)] hover:border-[var(--ae-line-2)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2457E6]",
        checked && ring
      )}
    >
      <span
        className={cn(
          "block overflow-hidden rounded-lg",
          checked ? "bg-[var(--ae-green-soft)]" : "bg-[var(--ae-thumb)]"
        )}
      >
        <AvatarCropImage draft={item.preview} crop={crop} height={height} />
      </span>
      <span
        className={cn(
          "truncate text-xs leading-tight",
          checked ? "font-bold text-[var(--ae-green-ink)]" : "font-semibold text-[var(--ae-ink-2)]"
        )}
      >
        {item.label}
      </span>
      {checked && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-2.5 right-2.5 flex size-[18px] items-center justify-center rounded-full",
            accent === "blue" ? "bg-[#2457E6]" : "bg-[var(--ae-green)]"
          )}
        >
          <Check className="size-2.5 text-white" strokeWidth={4} />
        </span>
      )}
    </button>
  );
}
