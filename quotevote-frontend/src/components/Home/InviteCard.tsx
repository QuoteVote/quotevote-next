"use client";

import { useState } from "react";
import { SendInviteDialog } from "@/components/Profile/SendInviteDialog";

/** Invite someone: opens the member invite dialog. */
export function InviteCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-[var(--shell-card-radius)] border-[length:var(--shell-border-w)] border-[var(--shell-green-line)] bg-[var(--shell-green-tint)] p-4 shadow-[var(--shell-card-shadow)]">
      <h2 className="text-sm! leading-[1.4]! font-bold! tracking-normal! text-[var(--shell-ink)]">
        Invite someone
      </h2>
      <p className="text-[12.5px] leading-normal text-[var(--shell-ink-2)]">
        Bring a neighbor or coworker into the conversation.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-[34px] cursor-pointer items-center self-start rounded-[10px] border-[length:var(--shell-border-w)] border-[var(--shell-primary-line)] bg-[var(--shell-primary)] px-3.5 text-[13px] font-bold text-[var(--shell-primary-ink)] shadow-[var(--shell-shadow)] hover:bg-[var(--shell-primary-hover)] [.neo-brutalism_&]:rounded-[4px]"
      >
        Send an invite
      </button>
      <SendInviteDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
