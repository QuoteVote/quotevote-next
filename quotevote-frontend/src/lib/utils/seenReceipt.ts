import moment from "moment";
import type { ChatMessage, SeenReceipt } from "@/types/chat";

function idOf(value: unknown): string | null {
  if (value == null) return null;
  const id = String(value);
  return id.length > 0 ? id : null;
}

/**
 * "Seen" for a direct conversation: whether the other member has read my latest message,
 * with the time they read it. Messages read before read times were recorded only list who
 * read them, so they give `readAt: null` ("Seen" without a time). Null when my latest
 * message hasn't been read, or I haven't written one.
 */
export function seenReceipt(messages: ChatMessage[], currentUserId: unknown): SeenReceipt | null {
  const me = idOf(currentUserId);
  if (!me) return null;

  let mine: ChatMessage | undefined;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (idOf(message.userId) === me && message.deleted !== true) {
      mine = message;
      break;
    }
  }
  if (!mine) return null;

  const times: Date[] = [];
  for (const entry of mine.readByDetailed ?? []) {
    const reader = idOf(entry?.userId);
    if (!entry?.readAt || !reader || reader === me) continue;
    const date = new Date(entry.readAt);
    if (!Number.isNaN(date.getTime())) times.push(date);
  }
  if (times.length > 0) {
    return { readAt: new Date(Math.min(...times.map((date) => date.getTime()))) };
  }

  const readBy = Array.isArray(mine.readBy) ? (mine.readBy as unknown[]) : [];
  return readBy.some((id) => idOf(id) && idOf(id) !== me) ? { readAt: null } : null;
}

/** "Seen 2:51 PM" today, "Seen yesterday at 2:51 PM", then "Seen Nov 18 at 2:51 PM"; "Seen" without a time. */
export function seenLabel(receipt: SeenReceipt): string {
  if (!receipt.readAt) return "Seen";
  return `Seen ${moment(receipt.readAt).calendar(null, {
    sameDay: "h:mm A",
    lastDay: "[yesterday at] h:mm A",
    lastWeek: "dddd [at] h:mm A",
    sameElse: "MMM D [at] h:mm A",
  })}`;
}
