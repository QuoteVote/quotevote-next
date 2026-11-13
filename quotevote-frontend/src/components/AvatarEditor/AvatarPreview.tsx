"use client";

import type { ReactNode } from "react";
import { Dice5, Download, Loader2, Lock, LockOpen, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { AvatarCircle, AvatarFigure } from "@/components/AvatarEditor/AvatarArt";
import { SHUFFLE_GROUP_ORDER } from "@/lib/avatarOptions";
import { cn } from "@/lib/utils";
import type {
  AvatarDraft,
  ShuffleLocksProps,
  AvatarStageProps,
  AvatarToolbarProps,
} from "@/types/avatar";

/** The big preview with the New / Saved compare toggle. */
export function AvatarStage({
  draft,
  saved,
  showSaved,
  onShowSaved,
  compact,
}: AvatarStageProps): ReactNode {
  return (
    <div
      className={cn(
        "relative flex items-end justify-center overflow-hidden",
        compact ? "h-[196px]" : "h-[280px] rounded-2xl"
      )}
      style={{ background: "linear-gradient(160deg, var(--ae-stage-from), var(--ae-stage-to))" }}
    >
      {!compact && (
        <span
          aria-hidden="true"
          className="absolute top-[22px] left-1/2 size-[236px] -translate-x-1/2 rounded-full bg-white/55 dark:bg-white/5"
        />
      )}
      <AvatarFigure
        draft={showSaved ? saved : draft}
        size={compact ? 180 : 250}
        className="relative"
        alt={showSaved ? "Your saved avatar" : "Avatar preview"}
      />
      <div
        role="group"
        aria-label="Compare with saved avatar"
        className="absolute top-3 left-3 flex rounded-[9px] border border-[var(--ae-line)] bg-white/85 p-[3px] dark:bg-black/40"
      >
        {[false, true].map((saved) => (
          <button
            key={String(saved)}
            type="button"
            aria-pressed={showSaved === saved}
            onClick={() => onShowSaved(saved)}
            className={cn(
              "inline-flex h-[26px] cursor-pointer items-center rounded-md border-0 px-2.5 text-xs font-bold",
              showSaved === saved
                ? "bg-[var(--ae-ink)] text-[var(--ae-surface)]"
                : "bg-transparent text-[var(--ae-muted)]"
            )}
          >
            {saved ? "Saved" : "New"}
          </button>
        ))}
      </div>
    </div>
  );
}

const TOOL =
  "flex h-[58px] cursor-pointer flex-col items-center justify-center gap-[5px] border-0 border-r border-[var(--ae-line-3)] bg-transparent text-[11.5px] font-bold text-[var(--ae-ink-2)] last:border-r-0 disabled:cursor-not-allowed disabled:text-[var(--ae-faint)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#2457E6]";

/** Undo, Redo, Shuffle, Reset and PNG download in one segmented bar. */
export function AvatarToolbar({ editor, downloading, onDownload }: AvatarToolbarProps): ReactNode {
  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-xl border border-[var(--ae-line)] bg-[var(--ae-surface)]">
      <button type="button" className={TOOL} onClick={editor.undo} disabled={!editor.canUndo}>
        <Undo2 className="size-[19px]" aria-hidden="true" />
        Undo
      </button>
      <button type="button" className={TOOL} onClick={editor.redo} disabled={!editor.canRedo}>
        <Redo2 className="size-[19px]" aria-hidden="true" />
        Redo
      </button>
      <button
        type="button"
        className={cn(TOOL, "bg-[var(--ae-green-tint)] text-[var(--ae-green)]")}
        onClick={editor.shuffle}
      >
        <Dice5 className="size-[19px]" aria-hidden="true" />
        Shuffle
      </button>
      <button
        type="button"
        className={TOOL}
        onClick={editor.reset}
        disabled={!editor.isDirty}
        aria-label="Reset to saved"
      >
        <RotateCcw className="size-[19px]" aria-hidden="true" />
        Reset
      </button>
      <button
        type="button"
        className={TOOL}
        onClick={onDownload}
        disabled={downloading}
        aria-label="Download as PNG"
      >
        {downloading ? (
          <Loader2 className="size-[19px] animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-[19px]" aria-hidden="true" />
        )}
        PNG
      </button>
    </div>
  );
}

/** "Shuffle keeps": parts that stay put when shuffling. */
export function ShuffleLocks({ locks, onToggle }: ShuffleLocksProps): ReactNode {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Shuffle keeps">
      {SHUFFLE_GROUP_ORDER.map((group) => {
        const on = locks.includes(group);
        const Icon = on ? Lock : LockOpen;
        return (
          <button
            key={group}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(group)}
            className={cn(
              "inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-bold",
              on
                ? "border-[var(--ae-green-line)] bg-[var(--ae-green-soft)] text-[var(--ae-green-ink)]"
                : "border-[var(--ae-line-2)] bg-[var(--ae-surface)] text-[var(--ae-ink-2)]"
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {group}
          </button>
        );
      })}
    </div>
  );
}

const SIZES: [number, string][] = [
  [72, "Profile"],
  [44, "Post"],
  [32, "Comment"],
  [24, "Alert"],
];

/** The avatar at the sizes the app uses. */
export function SizePreview({ draft }: { draft: AvatarDraft }): ReactNode {
  return (
    <div className="flex items-end justify-between rounded-xl border border-[var(--ae-line)] bg-[var(--ae-surface)] px-3 py-3.5">
      {SIZES.map(([size, label]) => (
        <figure key={label} className="m-0 flex flex-col items-center gap-1.5">
          <AvatarCircle draft={draft} size={size} />
          <figcaption className="text-[11.5px] font-semibold text-[var(--ae-muted)]">
            {label}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Small "Unsaved" pill. */
export function UnsavedBadge(): ReactNode {
  return (
    <span className="inline-flex h-7 items-center gap-[7px] rounded-full bg-[var(--ae-amber-soft)] px-2.5 text-[12.5px] font-bold text-[var(--ae-amber-ink)]">
      <i aria-hidden="true" className="block size-[7px] rounded-full bg-[var(--ae-amber)]" />
      Unsaved
    </span>
  );
}

export function SideLabel({ children }: { children: ReactNode }): ReactNode {
  return (
    <p className="m-0 mb-2.5 text-xs font-bold tracking-[0.06em] text-[var(--ae-muted)] uppercase">
      {children}
    </p>
  );
}
