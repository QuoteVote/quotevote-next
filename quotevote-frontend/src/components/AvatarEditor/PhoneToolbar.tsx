"use client";

import type { ReactNode } from "react";
import { Dice5, Download, Loader2, Lock, RotateCcw, Undo2 } from "lucide-react";
import { ShuffleLocks } from "@/components/AvatarEditor/AvatarPreview";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { avatarEditorFont } from "@/lib/fonts/avatarEditorFont";
import { cn } from "@/lib/utils";
import type { PhoneToolbarProps } from "@/types/avatar";

const ICON_BTN =
  "inline-flex h-10 min-w-10 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-[var(--ae-line)] bg-[var(--ae-surface)] px-3 text-[13px] font-bold text-[var(--ae-ink-2)] disabled:cursor-not-allowed disabled:text-[var(--ae-faint)]";

/** Phone tools under the preview: Undo, Reset, Shuffle, Shuffle keeps, PNG. */
export function PhoneToolbar({ editor, downloading, onDownload }: PhoneToolbarProps): ReactNode {
  return (
    <div className="flex justify-center gap-2 border-b border-[var(--ae-line)] bg-[var(--ae-surface)] px-4 py-3">
      <button
        type="button"
        aria-label="Undo"
        className={ICON_BTN}
        onClick={editor.undo}
        disabled={!editor.canUndo}
      >
        <Undo2 className="size-[18px]" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Reset to saved"
        className={ICON_BTN}
        onClick={editor.reset}
        disabled={!editor.isDirty}
      >
        <RotateCcw className="size-[18px]" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={cn(
          ICON_BTN,
          "border-[#BFE6D2] bg-[var(--ae-green-tint)] text-[var(--ae-green)] dark:border-[var(--ae-green-line)]"
        )}
        onClick={editor.shuffle}
      >
        <Dice5 className="size-[18px]" aria-hidden="true" />
        Shuffle
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label="Shuffle keeps" className={ICON_BTN}>
            <Lock className="size-[18px]" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className={cn(
            avatarEditorFont.variable,
            "avatar-editor w-auto max-w-[320px] rounded-xl border-[var(--ae-line)] bg-[var(--ae-surface)] p-3"
          )}
        >
          <p className="m-0 mb-2 text-xs font-bold tracking-[0.06em] text-[var(--ae-muted)] uppercase">
            Shuffle keeps
          </p>
          <ShuffleLocks locks={editor.locks} onToggle={editor.toggleLock} />
        </PopoverContent>
      </Popover>
      <button
        type="button"
        aria-label="Download as PNG"
        className={ICON_BTN}
        onClick={onDownload}
        disabled={downloading}
      >
        {downloading ? (
          <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
        ) : (
          <Download className="size-[18px]" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
