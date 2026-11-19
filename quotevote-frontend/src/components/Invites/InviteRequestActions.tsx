"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UPDATE_USER_INVITE_STATUS } from "@/graphql/mutations";
import { replaceGqlError } from "@/lib/utils/replaceGqlError";
import { requestActions } from "@/lib/utils/inviteStatus";
import type { InviteDeclineConfirmProps, InviteRequestActionsProps } from "@/types/admin";

/** Decline asks first, in a small popover next to the button. */
function DeclineConfirm({ email, disabled, onConfirm }: InviteDeclineConfirmProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="qv-auth-btn qv-auth-btn-sm qv-auth-btn-danger aria-expanded:shadow-[0_0_0_3px_rgba(255,96,96,0.25)]"
        >
          Decline
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        role="alertdialog"
        aria-labelledby="decline-invite-title"
        className="qv-auth qv-inv-popover flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-3 p-5"
      >
        <h2 id="decline-invite-title" className="m-0 text-[17px]! leading-snug! font-bold">
          Decline invitation?
        </h2>
        <p className="qv-auth-muted m-0 text-sm leading-[1.5]!">
          <span className="[overflow-wrap:anywhere]">{email}</span> won’t get an invite. You can
          reset it later.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="qv-auth-btn qv-auth-btn-sm"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="qv-auth-btn qv-auth-btn-sm qv-auth-btn-danger-solid"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            Decline
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Accept / Decline, Resend / Reset or Reset, depending on where the request stands. */
export function InviteRequestActions({ invite, onComplete }: InviteRequestActionsProps) {
  const [updateStatus, { loading }] = useMutation(UPDATE_USER_INVITE_STATUS);
  const actions = requestActions(invite);

  const run = async (inviteStatus: string, message: string) => {
    try {
      await updateStatus({ variables: { userId: invite._id, inviteStatus } });
      await onComplete();
      toast.success(message);
    } catch (err) {
      toast.error(replaceGqlError(err instanceof Error ? err.message : "Failed to update"));
    }
  };

  if (actions.length === 0) {
    return <span className="qv-auth-muted text-[13px] font-semibold">Signed up</span>;
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {actions.includes("accept") && (
        <button
          type="button"
          disabled={loading}
          className="qv-auth-btn qv-auth-btn-sm qv-auth-btn-primary"
          onClick={() => void run("4", "Invitation accepted")}
        >
          Accept
        </button>
      )}
      {actions.includes("decline") && (
        <DeclineConfirm
          email={invite.email}
          disabled={loading}
          onConfirm={() => void run("2", "Invitation declined")}
        />
      )}
      {actions.includes("resend") && (
        <button
          type="button"
          disabled={loading}
          className="qv-auth-btn qv-auth-btn-sm"
          onClick={() => void run("4", "Invitation resent")}
        >
          Resend
        </button>
      )}
      {actions.includes("reset") && (
        <button
          type="button"
          disabled={loading}
          className="qv-auth-btn qv-auth-btn-sm qv-auth-btn-ghost"
          onClick={() => void run("1", "Request reset to pending")}
        >
          Reset
        </button>
      )}
    </div>
  );
}
