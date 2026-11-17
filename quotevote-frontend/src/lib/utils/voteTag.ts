import { VOTE_LABELS } from "@/lib/constants/voteAxes";
import type { VoteOption } from "@/types/voting";

/**
 * A vote's response tag (`#true`, `#like`, ...), or null when it has none we know.
 * The API returns `tags` as a comma-joined string; older data may hold an array.
 */
export function voteTag(tags: unknown): VoteOption | null {
  const list = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",") : [];
  for (const raw of list) {
    const tag = String(raw).trim().toLowerCase();
    if (tag in VOTE_LABELS) return tag as VoteOption;
  }
  return null;
}
