import type {
  InviteCounts,
  InviteDisplayStatus,
  InviteRequest,
  InviteRequestAction,
  SentInvite,
} from "@/types/admin";
import { parseApiDate } from "@/lib/utils/apiDate";

/** Access request codes on the account: "1" pending, "2" declined, "4" accepted. */
export function requestStatus(status: string): InviteDisplayStatus {
  switch (Number(status)) {
    case 1:
      return "pending";
    case 2:
      return "declined";
    case 4:
      return "accepted";
    default:
      return "unknown";
  }
}

/** A sent invite still marked pending after its link lapsed shows as expired. */
export function sentInviteStatus(invite: SentInvite, now: Date = new Date()): InviteDisplayStatus {
  const status = invite.status?.toLowerCase();
  if (status === "pending") {
    const expires = parseApiDate(invite.expiresAt);
    return expires && expires <= now ? "expired" : "pending";
  }
  if (status === "accepted" || status === "declined" || status === "expired") return status;
  return "unknown";
}

/** What an admin can do with a request in its current state. */
export function requestActions(invite: InviteRequest): InviteRequestAction[] {
  switch (requestStatus(invite.status)) {
    case "pending":
      return ["accept", "decline"];
    case "accepted":
      // Once signup is done there is no link left to resend or take back.
      return invite.signedUp ? [] : ["resend", "reset"];
    default:
      return ["reset"];
  }
}

export function countRequests(invites: InviteRequest[]): InviteCounts {
  const counts: InviteCounts = { pending: 0, accepted: 0, declined: 0 };
  for (const invite of invites) {
    const status = requestStatus(invite.status);
    if (status === "pending" || status === "accepted" || status === "declined") counts[status] += 1;
  }
  return counts;
}

export function countSentInvites(invites: SentInvite[], now: Date = new Date()): InviteCounts {
  const counts: InviteCounts = { pending: 0, accepted: 0, declined: 0 };
  for (const invite of invites) {
    const status = sentInviteStatus(invite, now);
    if (status === "pending" || status === "accepted" || status === "declined") counts[status] += 1;
  }
  return counts;
}

/** "Nov 11, 2026", or an em dash when the date is missing. */
export function formatInviteDate(value: string | null | undefined): string {
  const date = parseApiDate(value);
  return date
    ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";
}
