import type { DeclaredPresenceStatus, PublicPresence } from "@/types/chat";
import { DEFAULT_PRESENCE_STATUS, PUBLIC_PRESENCE_STATUSES } from "@/lib/constants/presence";

const DECLARED_STATUSES: readonly DeclaredPresenceStatus[] = ["online", "away", "dnd", "invisible"];

/** True when `status` is one a user can have chosen (offline and unknown are not). */
export function isDeclaredStatus(status: string | null | undefined): status is DeclaredPresenceStatus {
  return DECLARED_STATUSES.some((declared) => declared === status);
}

/**
 * Turns whatever the API or store holds into a status the user can actually
 * have chosen. Anything else (offline, unknown, empty) is "no declared status
 * yet", which is Invisible (#468).
 */
export function toDeclaredStatus(status: string | null | undefined): DeclaredPresenceStatus {
  return isDeclaredStatus(status) ? status : DEFAULT_PRESENCE_STATUS;
}

/**
 * The only place that decides what the public may see of someone's status.
 *
 * Returns `null` for Invisible, Offline and anything unknown, so no indicator
 * is drawn and the status message is never shown, even when one is still
 * stored on the server. For Available, Away and Do Not Disturb it returns the
 * status and its trimmed message (#468).
 */
export function getPublicPresence(
  status: string | null | undefined,
  statusMessage?: string | null
): PublicPresence | null {
  const publicStatus = PUBLIC_PRESENCE_STATUSES.find((visible) => visible === status);
  if (!publicStatus) return null;

  return {
    status: publicStatus,
    statusMessage: typeof statusMessage === "string" ? statusMessage.trim() : "",
  };
}
