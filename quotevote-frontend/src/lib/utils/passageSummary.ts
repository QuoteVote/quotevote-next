import type { LinkedPassage } from "@/types/discussionSplit";
import type { PassageSummary, PostAction } from "@/types/postActions";

function overlaps(action: PostAction, start: number, end: number): boolean {
  const a = action as { startWordIndex?: number | null; endWordIndex?: number | null };
  if (typeof a.startWordIndex !== "number" || typeof a.endWordIndex !== "number") return false;
  if (a.endWordIndex <= a.startWordIndex) return false;
  return a.startWordIndex < end && a.endWordIndex > start;
}

/**
 * The selected passage's words and the responses on it: votes, quotes and
 * comments whose range overlaps it. Null when nothing usable is selected.
 */
export function summarizePassage(
  postText: string | null | undefined,
  passage: LinkedPassage | null,
  actions: PostAction[]
): PassageSummary | null {
  if (!passage || !postText) return null;
  const { startWordIndex: start, endWordIndex: end } = passage;
  if (!(end > start) || start < 0 || end > postText.length) return null;
  const text = postText.slice(start, end).replace(/\s+/g, " ").trim();
  if (!text) return null;

  let agree = 0;
  let disagree = 0;
  let responses = 0;
  for (const action of actions) {
    if (action.__typename === "Message" || !overlaps(action, start, end)) continue;
    responses += 1;
    if (action.__typename === "Vote") {
      const type = (action as { type?: string }).type;
      if (type === "up" || type === "upvote") agree += 1;
      else disagree += 1;
    }
  }
  return { text, agree, disagree, responses };
}
