'use client'

import { X } from 'lucide-react'
import type { SelectedPassageSummaryProps } from '@/types/postActions'

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/**
 * The selected passage at the top of Discussion: its words, its votes per response
 * (agree, true, like, ...) and how many responses it has.
 */
export default function SelectedPassageSummary({ summary, onClear }: SelectedPassageSummaryProps) {
  return (
    <section
      aria-label="Selected passage"
      data-testid="selected-passage-summary"
      className="font-redesign flex flex-col gap-2.5 rounded-2xl border border-[#cbebd8] bg-[#eef9f3] px-4 py-3.5 dark:border-[#2a6b4f] dark:bg-[#10261d] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-[2.5px] [.neo-brutalism_&]:border-[var(--shell-line)] [.neo-brutalism_&]:shadow-[var(--shell-shadow)]"
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--shell-green-soft)] pt-1.5 font-serif text-[22px] font-extrabold leading-none text-[var(--shell-green)]"
        >
          “
        </span>
        <b className="line-clamp-3 flex-1 text-[15px] leading-[1.45] text-[var(--shell-ink)]">{summary.text}</b>
        <button
          type="button"
          onClick={onClear}
          aria-label="Show all responses"
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[var(--shell-radius)] text-[var(--shell-ink-2)] hover:bg-[var(--shell-hover)]"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <p className="flex flex-wrap items-center gap-3 text-[13px]! leading-normal! font-extrabold">
        {summary.votes.map((vote) => (
          <span
            key={vote.key}
            className={
              vote.direction === 'up'
                ? 'text-[#11683d] dark:text-[#7fdcb0]'
                : 'text-[#a12424] dark:text-[#ff9a9a]'
            }
          >
            {vote.direction === 'up' ? '↑' : '↓'} {vote.count} {vote.label}
          </span>
        ))}
        <span className="font-bold text-[var(--shell-muted)]">
          {plural(summary.responses, 'response', 'responses')}
        </span>
      </p>
    </section>
  )
}
