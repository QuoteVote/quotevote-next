"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DirectoryTopic } from "@/types/directory";

const VISIBLE_TOPICS = 6;

const OPTION =
  "flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-2.5 text-left text-sm font-semibold text-[var(--shell-ink-2)] hover:bg-[var(--shell-hover)]";
const OPTION_ON =
  "bg-[var(--shell-surface)] font-bold text-[var(--shell-ink)] shadow-[0_0_0_1px_var(--shell-line),0_1px_2px_rgba(15,23,42,0.05)] hover:bg-[var(--shell-surface)]";

function Hash({ on, children }: { on: boolean; children: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 flex-shrink-0 items-center justify-center rounded-[7px] text-xs font-extrabold",
        on
          ? "bg-[var(--shell-green-soft)] text-[var(--shell-green)]"
          : "bg-[var(--shell-hover)] text-[var(--shell-muted)]"
      )}
    >
      {children}
    </span>
  );
}

/** Any topic plus the public topics; the first few show, the rest behind "Show all". */
export function TopicList({
  topics,
  selectedId,
  onSelect,
}: {
  topics: DirectoryTopic[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedIndex = topics.findIndex((t) => t._id === selectedId);
  const limit = Math.max(VISIBLE_TOPICS, selectedIndex + 1);
  const shown = expanded ? topics : topics.slice(0, limit);

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        aria-pressed={!selectedId}
        onClick={() => onSelect("")}
        className={cn(OPTION, !selectedId && OPTION_ON)}
      >
        <Hash on={!selectedId}>✱</Hash>
        Any topic
      </button>
      {shown.map((topic) => {
        const on = topic._id === selectedId;
        return (
          <button
            key={topic._id}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(topic._id)}
            className={cn(OPTION, on && OPTION_ON)}
          >
            <Hash on={on}>#</Hash>
            <span className="truncate">{topic.title}</span>
          </button>
        );
      })}
      {topics.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 self-start rounded-md px-2.5 py-1 text-[13px] font-bold text-[var(--shell-blue)] hover:underline"
        >
          {expanded ? "Show fewer topics" : `Show all ${topics.length} topics`}
        </button>
      ) : null}
    </div>
  );
}
