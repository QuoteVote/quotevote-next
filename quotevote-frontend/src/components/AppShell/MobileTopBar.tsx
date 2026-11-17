"use client";

import { ArrowLeft, Menu, Search, Share2 } from "lucide-react";
import type { MobileTopBarProps } from "@/types/appShell";
import { Wordmark } from "./Wordmark";

const ICON_BTN =
  "inline-flex size-11 cursor-pointer items-center justify-center rounded-[var(--shell-radius)] border-0 bg-transparent text-[var(--shell-ink-2)] hover:bg-[var(--shell-hover)]";

function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open menu"
      data-testid="authenticated-menu-button"
      className={ICON_BTN}
    >
      <Menu className="size-[22px]" aria-hidden="true" />
    </button>
  );
}

/** Phone top bar: wordmark with Search and Menu; on a post, Back and Share around it. */
export function MobileTopBar({
  isPostDetail,
  loggedIn,
  onBack,
  onShare,
  onSearch,
  onOpenMenu,
}: MobileTopBarProps) {
  return (
    <header
      data-app-header
      className="font-redesign fixed top-0 right-0 left-0 z-50 flex h-[var(--app-header-h)] items-center border-b-[length:var(--shell-border-w)] border-[var(--shell-line)] bg-[var(--shell-surface)] md:hidden"
    >
      {isPostDetail ? (
        <div className="relative flex h-full w-full items-center px-1">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className={`z-10 ${ICON_BTN}`}
          >
            <ArrowLeft className="size-[22px]" aria-hidden="true" />
          </button>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Wordmark className="pointer-events-auto text-[20px]" />
          </div>
          <div className="z-10 ml-auto flex items-center">
            <button type="button" onClick={onShare} aria-label="Share" className={ICON_BTN}>
              <Share2 className="size-[22px]" aria-hidden="true" />
            </button>
            {loggedIn && <MenuButton onClick={onOpenMenu} />}
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-between pr-2 pl-4">
          <Wordmark className="text-[20px]" />
          <div className="flex items-center">
            <button type="button" onClick={onSearch} aria-label="Search" className={ICON_BTN}>
              <Search className="size-[22px]" aria-hidden="true" />
            </button>
            {loggedIn && <MenuButton onClick={onOpenMenu} />}
          </div>
        </div>
      )}
    </header>
  );
}
