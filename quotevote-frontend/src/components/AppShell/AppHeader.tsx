"use client";

import { Suspense } from "react";
import { Bell, MessageSquare, Plus } from "lucide-react";
import NavSearch from "@/components/Navbars/NavSearch";
import { cn } from "@/lib/utils";
import type { AppHeaderProps } from "@/types/appShell";
import { AccountMenu } from "./AccountMenu";
import { CountBadge } from "./CountBadge";
import { Wordmark } from "./Wordmark";

const ICON_BTN =
  "relative inline-flex size-11 cursor-pointer items-center justify-center rounded-[var(--shell-radius)] border-0 bg-transparent text-[var(--shell-ink-2)] transition-colors duration-150 hover:bg-[var(--shell-hover)] focus-visible:shadow-[var(--shell-focus)] focus-visible:outline-none";
const ICON_BTN_ON =
  "bg-[var(--shell-on-bg)] text-[var(--shell-on-ink)] hover:bg-[var(--shell-on-bg)]";

const PRIMARY_BTN =
  "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--shell-radius)] border-[length:var(--shell-border-w)] border-[var(--shell-primary-line)] bg-[var(--shell-primary)] px-[18px] text-sm font-bold whitespace-nowrap text-[var(--shell-primary-ink)] shadow-[var(--shell-shadow)] transition-colors duration-150 hover:bg-[var(--shell-primary-hover)] focus-visible:shadow-[var(--shell-focus)] focus-visible:outline-none";

function unreadLabel(name: string, count: number, word: string): string {
  if (count <= 0) return name;
  return `${name}, ${count > 9 ? "9 or more" : count} ${word}`;
}

/** Desktop top bar of the redesign: wordmark, search, Create, Messages, Notifications, account. */
export function AppHeader({ user, counts, panels, onCreate, onSignIn, onLogout }: AppHeaderProps) {
  return (
    <header
      data-app-header
      data-testid="authenticated-navigation"
      className="font-redesign fixed top-0 right-0 left-0 z-50 hidden h-[var(--app-header-h)] items-center gap-6 border-b-[length:var(--shell-border-w)] border-[var(--shell-line)] bg-[var(--shell-surface)] px-8 md:flex"
    >
      <Wordmark className="w-auto flex-shrink-0 text-[25px] lg:w-[248px]" />

      <div className="mx-auto min-w-0 flex-1 md:max-w-[560px]">
        <Suspense
          fallback={
            <div className="h-11 w-full rounded-[var(--shell-radius)] bg-[var(--shell-field)]" />
          }
        >
          <NavSearch />
        </Suspense>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          data-testid="create-post-button"
          onClick={onCreate}
          className={cn(PRIMARY_BTN, "mr-1.5")}
          aria-label="Create new quote"
        >
          <Plus className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
          Create
        </button>

        {user && (
          <>
            <button
              type="button"
              onClick={panels.onToggleChat}
              className={cn(ICON_BTN, panels.chatOpen && ICON_BTN_ON)}
              aria-label={unreadLabel("Messages", counts.unreadMessages, "unread")}
              aria-expanded={panels.chatOpen}
              data-testid="desktop-messages-button"
            >
              <MessageSquare className="size-[22px]" aria-hidden="true" />
              <CountBadge count={counts.unreadMessages} className="top-[5px] right-1" />
            </button>
            <button
              type="button"
              onClick={panels.onToggleNotifications}
              className={cn(ICON_BTN, panels.notificationsOpen && ICON_BTN_ON)}
              aria-label={unreadLabel("Notifications", counts.unreadNotifications, "new")}
              aria-expanded={panels.notificationsOpen}
              data-testid="desktop-notifications-button"
            >
              <Bell className="size-[22px]" aria-hidden="true" />
              <CountBadge count={counts.unreadNotifications} className="top-[5px] right-1" />
            </button>
            <AccountMenu user={user} onLogout={onLogout} />
          </>
        )}

        {!user && (
          <button
            type="button"
            onClick={onSignIn}
            className="ml-1.5 inline-flex h-11 cursor-pointer items-center rounded-[var(--shell-radius)] border-[length:var(--shell-border-w)] border-[var(--shell-line)] bg-[var(--shell-surface)] px-[18px] text-sm font-bold text-[var(--shell-ink)] hover:bg-[var(--shell-hover)]"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
