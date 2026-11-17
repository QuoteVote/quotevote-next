"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, House, MessageSquare, Plus, User } from "lucide-react";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { cn } from "@/lib/utils";
import type { MobileTabBarProps } from "@/types/appShell";
import { CountBadge } from "./CountBadge";

const TAB =
  "relative flex h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] border-0 bg-transparent text-[10.5px] font-bold text-[var(--shell-muted)] no-underline";
const TAB_ON =
  "text-[var(--shell-tab-on)] before:absolute before:top-0 before:h-[3px] before:w-[26px] before:rounded-b-[3px] before:bg-[var(--shell-tab-on)] before:content-['']";
const TAB_BADGE = "top-[5px] left-[calc(50%+4px)] h-[17px] min-w-[17px] px-1 text-[9.5px]";

function TabLabel({ children }: { children: ReactNode }) {
  return <span className="leading-none">{children}</span>;
}

/** Phone tab bar: Home, Messages, Create, Notifications and Profile. */
export function MobileTabBar({
  user,
  counts,
  panels,
  homeActive,
  profileActive,
  createActive,
  hidden,
  onHome,
  onCreate,
  onSignIn,
}: MobileTabBarProps) {
  const unreadNotifications = counts.unreadNotifications;
  return (
    <nav
      className={cn(
        "font-redesign fixed right-0 bottom-0 left-0 z-[60] flex h-[var(--app-tabbar-h)] items-start border-t-[length:var(--shell-border-w)] border-[var(--shell-line)] bg-[var(--shell-surface)] px-1.5 pt-1 pb-[env(safe-area-inset-bottom,0px)] shadow-[var(--shell-tab-shadow)] md:hidden",
        hidden && "hidden"
      )}
      aria-label="Mobile navigation"
      data-testid="authenticated-navigation"
      hidden={hidden}
    >
      <Link
        href="/"
        onClick={onHome}
        className={cn(TAB, homeActive && TAB_ON)}
        aria-label="Home"
        aria-current={homeActive ? "page" : undefined}
      >
        <House className="size-[22px]" aria-hidden="true" />
        <TabLabel>Home</TabLabel>
      </Link>

      <button
        type="button"
        onClick={panels.onToggleChat}
        className={cn(TAB, panels.chatOpen && TAB_ON)}
        aria-label="Messages"
        aria-expanded={panels.chatOpen}
      >
        <MessageSquare className="size-[22px]" aria-hidden="true" />
        <TabLabel>Messages</TabLabel>
        <CountBadge count={counts.unreadMessages} className={TAB_BADGE} />
      </button>

      <button
        type="button"
        data-testid="create-post-button"
        onClick={onCreate}
        aria-label="Create"
        className={cn(
          "mx-2 -mt-3.5 flex size-[54px] flex-shrink-0 cursor-pointer items-center justify-center rounded-[var(--shell-create-radius)] border-[length:var(--shell-border-w)] border-[var(--shell-primary-line)] bg-[var(--shell-primary)] text-[var(--shell-primary-ink)]",
          "shadow-[0_10px_20px_-8px_rgba(15,125,86,0.8),0_0_0_5px_var(--shell-surface)] [.neo-brutalism_&]:shadow-[var(--shell-shadow)]",
          createActive && "scale-95 bg-[var(--shell-primary-hover)]"
        )}
      >
        <Plus className="size-[26px]" strokeWidth={2.5} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={panels.onToggleNotifications}
        className={cn(TAB, panels.notificationsOpen && TAB_ON)}
        aria-label={
          unreadNotifications > 0 ? `Notifications, ${unreadNotifications} new` : "Notifications"
        }
        aria-expanded={panels.notificationsOpen}
        data-testid="mobile-notifications-button"
      >
        <Bell className="size-[22px]" aria-hidden="true" />
        <TabLabel>Notifications</TabLabel>
        <CountBadge count={unreadNotifications} className={TAB_BADGE} />
      </button>

      {user ? (
        <Link
          href="/profile"
          className={cn(TAB, profileActive && TAB_ON)}
          aria-label="Profile"
          aria-current={profileActive ? "page" : undefined}
          data-testid="user-profile-menu"
        >
          <DisplayAvatar
            avatar={user.avatar}
            username={user.avatarSeed}
            size={24}
            className={cn(
              "size-6",
              profileActive && "ring-2 ring-[var(--shell-tab-on)] ring-offset-1"
            )}
          />
          <TabLabel>Profile</TabLabel>
        </Link>
      ) : (
        <button type="button" onClick={onSignIn} className={TAB} aria-label="Sign in">
          <User className="size-[22px]" aria-hidden="true" />
          <TabLabel>Sign in</TabLabel>
        </button>
      )}
    </nav>
  );
}
