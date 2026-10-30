import type {
  DeclaredPresenceStatus,
  PresenceStatus,
  PresenceStatusOption,
  PublicPresenceStatus,
} from "@/types/chat";

/**
 * What each presence status is called when someone else looks at it.
 * `online` is the stored value for "Available" (#468): the label changed, the
 * value did not, so existing records and the API keep working.
 */
export const PRESENCE_LABEL: Record<PresenceStatus, string> = {
  online: "Available",
  away: "Away",
  dnd: "Do Not Disturb",
  offline: "Offline",
  invisible: "Offline",
};

/**
 * What each status is called to the person who chose it. Invisible looks
 * offline to everyone else, but you should still see that you picked it (#468).
 */
export const OWN_PRESENCE_LABEL: Record<PresenceStatus, string> = {
  ...PRESENCE_LABEL,
  invisible: "Invisible",
};

/** The status everyone starts with until they pick one (#468). */
export const DEFAULT_PRESENCE_STATUS: DeclaredPresenceStatus = "invisible";

/** Longest status message the API accepts. */
export const STATUS_MESSAGE_MAX_LENGTH = 200;

/** The status picker, in display order (#468). */
export const PRESENCE_STATUS_OPTIONS: PresenceStatusOption[] = [
  { value: "online", label: "Available", icon: "🟢" },
  { value: "away", label: "Away", icon: "🟡" },
  { value: "dnd", label: "Do Not Disturb", icon: "🔴" },
  { value: "invisible", label: "Invisible", icon: "⚫" },
];

/** Statuses other people can see. Invisible (and offline) show nothing (#468). */
export const PUBLIC_PRESENCE_STATUSES: readonly PublicPresenceStatus[] = ["online", "away", "dnd"];

/**
 * Presence dot fill and edge (#531). Away is a clear yellow, not the amber that
 * read as a second orange-green next to Available; each dot has a darker edge so
 * it stays visible on white and on the green header.
 */
export const PRESENCE_DOT_CLASS: Record<PresenceStatus, string> = {
  online: "border border-[#2f7a4c] bg-[#52b274]",
  away: "border border-[#a16207] bg-[#facc15]",
  dnd: "border border-[#b91c1c] bg-[#ef4444]",
  offline: "border border-[#71717a] bg-[#a1a1aa]",
  invisible: "border border-[#71717a] bg-[#a1a1aa]",
};

/** Readable status text next to a name, in both themes. */
export const PRESENCE_TEXT_CLASS: Record<PresenceStatus, string> = {
  online: "text-[#2f6f4a] dark:text-[#7fdc9c]",
  away: "text-[#854d0e] dark:text-[#fde047]",
  dnd: "text-[#b91c1c] dark:text-[#fca5a5]",
  offline: "text-muted-foreground",
  invisible: "text-muted-foreground",
};

export const toPresenceStatus = (status: string | null | undefined): PresenceStatus =>
  status && status in PRESENCE_LABEL ? (status as PresenceStatus) : "offline";
