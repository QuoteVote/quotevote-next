import { VOTE_LABELS } from "@/lib/constants/voteAxes";
import type { LinkedPassage } from "@/types/discussionSplit";
import type { PassageSummary, PassageVoteCount, PostAction } from "@/types/postActions";
import type { VoteOption } from "@/types/voting";
import { voteTag } from "@/lib/utils/voteTag";

/** Display order: each pair together, the up side first. */
const TAG_ORDER: VoteOption[] = ["#agree", "#disagree", "#true", "#false", "#like", "#dislike"];
const UP_TAGS = new Set<VoteOption>(["#agree", "#true", "#like"]);

function overlaps(action: PostAction, start: number, end: number): boolean {
  const a = action as { startWordIndex?: number | null; endWordIndex?: number | null };
  if (typeof a.startWordIndex !== "number" || typeof a.endWordIndex !== "number") return false;
  if (a.endWordIndex <= a.startWordIndex) return false;
  return a.startWordIndex < end && a.endWordIndex > start;
}

function isUp(type: unknown): boolean {
  return type === "up" || type === "upvote";
}

/**
 * Vote counts per response (agree, false, like, ...), in pair order and only those with votes.
 * Votes without a known response tag are counted as plain up or down votes, last.
 */
function countVotes(votes: PostAction[]): PassageVoteCount[] {
  const byTag = new Map<VoteOption, number>();
  let up = 0;
  let down = 0;
  for (const vote of votes) {
    const v = vote as { type?: unknown; tags?: unknown };
    const tag = voteTag(v.tags);
    if (tag) byTag.set(tag, (byTag.get(tag) ?? 0) + 1);
    else if (isUp(v.type)) up += 1;
    else down += 1;
  }
  const counts: PassageVoteCount[] = TAG_ORDER.filter((tag) => byTag.has(tag)).map((tag) => ({
    key: tag,
    label: VOTE_LABELS[tag].toLowerCase(),
    count: byTag.get(tag) ?? 0,
    direction: UP_TAGS.has(tag) ? "up" : "down",
  }));
  if (up) {
    const label = up === 1 ? "upvote" : "upvotes";
    counts.push({ key: "up", label, count: up, direction: "up" });
  }
  if (down) {
    const label = down === 1 ? "downvote" : "downvotes";
    counts.push({ key: "down", label, count: down, direction: "down" });
  }
  return counts;
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

  const onPassage = actions.filter(
    (action) => action.__typename !== "Message" && overlaps(action, start, end)
  );
  const votes = countVotes(onPassage.filter((action) => action.__typename === "Vote"));
  return { text, votes, responses: onPassage.length };
}
