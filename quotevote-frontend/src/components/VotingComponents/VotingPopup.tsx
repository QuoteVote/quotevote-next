"use client";

import { useState } from "react";
import { Check, Heart, HeartCrack, Quote, ThumbsDown, ThumbsUp, Vote, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectionPopupMode, VoteResponseOption, VotingPopupProps } from "@/types/voting";

// Rows follow the design: positive on the left, negative on the right.
const VOTE_ROWS: [VoteResponseOption, VoteResponseOption][] = [
  [
    {
      type: "up",
      tags: "#agree",
      label: "Agree",
      icon: ThumbsUp,
      testId: "highlight-agree-button",
    },
    {
      type: "down",
      tags: "#disagree",
      label: "Disagree",
      icon: ThumbsDown,
      testId: "highlight-disagree-button",
    },
  ],
  [
    { type: "up", tags: "#true", label: "True", icon: Check, testId: "highlight-true-button" },
    { type: "down", tags: "#false", label: "False", icon: X, testId: "highlight-false-button" },
  ],
  [
    {
      type: "up",
      tags: "#like",
      label: "Like",
      icon: Heart,
      filledIcon: true,
      testId: "highlight-like-button",
    },
    {
      type: "down",
      tags: "#dislike",
      label: "Dislike",
      icon: HeartCrack,
      testId: "highlight-dislike-button",
    },
  ],
];

const VOTE_PANEL_ID = "selection-popup-vote-options";

const MODE_CLASS = cn(
  "flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px]",
  "text-[16px] font-bold text-[var(--shell-ink)] transition-colors sm:min-h-[84px] sm:text-[17px]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shell-blue)]",
  "[.neo-brutalism_&]:rounded-[4px]"
);
const MODE_ON =
  "border-[var(--shell-blue)] bg-[var(--shell-blue-soft)] [.neo-brutalism_&]:border-[var(--shell-line)] [.neo-brutalism_&]:border-[2.5px]";
const MODE_OFF = "border-transparent bg-[var(--shell-field)] hover:bg-[var(--shell-hover)]";

/**
 * VotingPopup component
 * Selection popup with two mutually exclusive modes: Quote (send the passage to the
 * Discussion composer) and Vote (Agree/Disagree, True/False, Like/Dislike on the passage).
 */
export default function VotingPopup({
  onVote,
  onQuote,
  selectedText,
  userVotes,
  onRemoveVote,
  onDismiss,
  variant = "popover",
}: VotingPopupProps) {
  const sheet = variant === "sheet";
  const [mode, setMode] = useState<SelectionPopupMode | null>(null);
  // Tag whose vote request is in flight, so a double tap can't cast it twice.
  const [pendingTag, setPendingTag] = useState<VoteResponseOption["tags"] | null>(null);

  const handleQuote = () => {
    setMode("quote");
    onQuote(selectedText);
    onDismiss?.();
  };

  const handleVoteMode = () => {
    setMode((current) => (current === "vote" ? null : "vote"));
  };

  // Each response is its own toggle; the popup stays open so several can be set in a row.
  const handleResponse = async (option: VoteResponseOption) => {
    if (pendingTag) return;
    const existing = findVote(option);
    setPendingTag(option.tags);
    try {
      if (existing) {
        await onRemoveVote(existing._id);
      } else {
        await onVote({ type: option.type, tags: option.tags });
      }
    } finally {
      setPendingTag(null);
    }
  };

  const findVote = (option: VoteResponseOption) =>
    userVotes.find((vote) => vote.type === option.type && vote.tags === option.tags);

  return (
    <div
      role="group"
      aria-label="Passage actions"
      data-testid="selection-popup"
      // Keep the text selection alive while pressing popup buttons with a mouse.
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        "font-redesign bg-[var(--shell-surface)] text-[var(--shell-ink)]",
        sheet
          ? "max-h-[calc(100dvh-0.5rem)] w-full overflow-y-auto overscroll-contain rounded-t-[22px] px-[18px] pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] [.neo-brutalism_&]:rounded-t-[6px] [.neo-brutalism_&]:border-t-[2.5px] [.neo-brutalism_&]:border-[var(--shell-line)]"
          : cn(
              "w-[min(28.5rem,calc(100vw-1.25rem))] rounded-[18px] border border-[var(--shell-line)] p-[18px]",
              "shadow-[0_24px_48px_-16px_rgba(15,23,42,0.28)] animate-in fade-in-0 zoom-in-95",
              "[.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-[2.5px] [.neo-brutalism_&]:shadow-[var(--shell-card-shadow)]"
            )
      )}
    >
      {sheet && (
        <>
          <span
            aria-hidden="true"
            className="mx-auto mb-3.5 block h-1 w-10 rounded-full bg-[var(--shell-muted)] opacity-30"
          />
          {/* The whole passage, never cut off (#760). A long one scrolls inside the box, so
              Quote and Vote stay on screen; overscroll-contain keeps the page still. */}
          <div className="mb-3.5 flex items-start gap-2.5 rounded-[12px] bg-[var(--shell-blue-soft)] py-2.5 pl-3 text-[15px] leading-[1.4] font-bold [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--shell-line)]">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-[var(--shell-surface)] pt-1 font-serif text-[15px] leading-none text-[var(--shell-blue)]"
            >
              “
            </span>
            <div
              role="region"
              aria-label="Selected passage"
              tabIndex={0}
              data-testid="selection-sheet-passage"
              className="max-h-[min(35dvh,20rem)] min-w-0 flex-1 overflow-y-auto overscroll-contain pr-3 break-words whitespace-pre-wrap focus-visible:rounded-[6px] focus-visible:outline-2 focus-visible:outline-[var(--shell-blue)]"
            >
              {selectedText.text}
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          data-testid="highlight-quote-button"
          aria-pressed={mode === "quote"}
          onClick={handleQuote}
          className={cn(MODE_CLASS, mode === "quote" ? MODE_ON : MODE_OFF)}
        >
          <Quote className="size-[22px]" strokeWidth={2.2} aria-hidden="true" />
          Quote
        </button>
        <button
          type="button"
          data-testid="highlight-vote-mode-button"
          aria-pressed={mode === "vote"}
          aria-expanded={mode === "vote"}
          aria-controls={VOTE_PANEL_ID}
          onClick={handleVoteMode}
          className={cn(MODE_CLASS, mode === "vote" ? MODE_ON : MODE_OFF)}
        >
          <Vote className="size-[22px]" strokeWidth={2.2} aria-hidden="true" />
          Vote
        </button>
      </div>

      {mode === "vote" && (
        <div
          id={VOTE_PANEL_ID}
          data-testid="highlight-vote-options"
          className={cn(
            "animate-in fade-in-0 slide-in-from-top-1",
            // The phone sheet has no divider, as in the design.
            sheet ? "mt-3" : "mt-4 border-t border-[var(--shell-divider)] pt-4"
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            {VOTE_ROWS.flat().map((option) => {
              const active = Boolean(findVote(option));
              const positive = option.type === "up";
              const Icon = option.icon;
              return (
                <button
                  key={option.tags}
                  type="button"
                  data-testid={option.testId}
                  aria-pressed={active}
                  aria-label={
                    active ? `${option.label} (your vote, press to remove)` : option.label
                  }
                  disabled={pendingTag !== null}
                  aria-busy={pendingTag === option.tags}
                  onClick={() => handleResponse(option)}
                  className={cn(
                    "flex min-h-[52px] items-center gap-3 rounded-[12px] border-2 px-4 sm:min-h-[54px] sm:px-5",
                    "text-[16px] font-bold text-[var(--shell-ink)] transition-[filter,border-color] sm:text-[17px]",
                    "hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--shell-blue)]",
                    "disabled:cursor-not-allowed disabled:opacity-50 [.neo-brutalism_&]:rounded-[4px]",
                    positive ? "bg-[var(--shell-green-soft)]" : "bg-[var(--shell-down-soft)]",
                    active
                      ? cn(
                          positive ? "border-[var(--shell-green)]" : "border-[var(--shell-down)]",
                          "shadow-[0_0_0_3px_var(--shell-surface)_inset] [.neo-brutalism_&]:border-[var(--shell-line)] [.neo-brutalism_&]:shadow-[var(--shell-shadow)]"
                        )
                      : "border-transparent"
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    strokeWidth={2.2}
                    className={cn(
                      "size-[22px] shrink-0",
                      positive ? "text-[var(--shell-green)]" : "text-[var(--shell-down)]",
                      option.filledIcon && "fill-current"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[12.5px]! leading-normal! font-semibold text-[var(--shell-muted)]">
            Your vote is outlined. {sheet ? "Tap" : "Press"} it again to remove it.
          </p>
        </div>
      )}
    </div>
  );
}
