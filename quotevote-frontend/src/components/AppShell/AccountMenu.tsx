"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings2, ShieldCheck, User } from "lucide-react";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShellUser } from "@/types/appShell";

const ITEM_CLASS = "cursor-pointer rounded-lg gap-3 py-2.5 px-3";
const ICON_WRAP = "flex items-center justify-center w-8 h-8 rounded-full";

/** Desktop account button (avatar and username) with Profile, Settings, Admin and Sign out. */
export function AccountMenu({ user, onLogout }: { user: ShellUser; onLogout: () => void }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group ml-1.5 flex h-11 cursor-pointer items-center gap-2 rounded-[var(--shell-pill-radius)] border-[length:var(--shell-border-w)] border-[var(--shell-line)] bg-[var(--shell-surface)] pr-2.5 pl-1 text-sm font-bold text-[var(--shell-ink)] shadow-[var(--shell-shadow)] hover:bg-[var(--shell-hover)] focus-visible:shadow-[var(--shell-focus)] focus-visible:outline-none"
          aria-label="Account menu"
          data-testid="user-profile-menu"
        >
          <span className="relative flex-shrink-0">
            <DisplayAvatar
              avatar={user.avatar}
              username={user.avatarSeed}
              size={36}
              className="size-9"
            />
            <span
              aria-hidden="true"
              className="absolute -right-px -bottom-px size-3 rounded-full border-[2.5px] border-[var(--shell-surface)] bg-[#22c38e]"
            />
          </span>
          <span className="max-w-[110px] truncate">{user.username}</span>
          <ChevronDown
            className="size-4 text-[var(--shell-muted)] transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="font-redesign w-[280px] overflow-hidden rounded-xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <DisplayAvatar
            avatar={user.avatar}
            username={user.avatarSeed}
            size={40}
            className="size-10"
          />
          <p className="truncate text-[15px] font-bold">{user.username}</p>
        </div>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem onClick={() => router.push("/profile")} className={ITEM_CLASS}>
          <span className={`${ICON_WRAP} bg-muted`}>
            <User className="size-4 text-muted-foreground" />
          </span>
          <span className="text-[13px] font-semibold">Your Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")} className={ITEM_CLASS}>
          <span className={`${ICON_WRAP} bg-muted`}>
            <Settings2 className="size-4 text-muted-foreground" />
          </span>
          <span className="text-[13px] font-semibold">Settings</span>
        </DropdownMenuItem>
        {user.isAdmin && (
          <DropdownMenuItem onClick={() => router.push("/control-panel")} className={ITEM_CLASS}>
            <span className={`${ICON_WRAP} bg-[var(--shell-on-bg)]`}>
              <ShieldCheck className="size-4 text-[var(--shell-tab-on)]" />
            </span>
            <span className="text-[13px] font-semibold">Admin Panel</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem onClick={onLogout} className={`${ITEM_CLASS} focus:bg-destructive/10`}>
          <span className={`${ICON_WRAP} bg-destructive/10`}>
            <LogOut className="size-4 text-red-500" />
          </span>
          <span className="text-[13px] font-semibold text-[#c62828] dark:text-[#ff6b6b]">
            Sign out
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
