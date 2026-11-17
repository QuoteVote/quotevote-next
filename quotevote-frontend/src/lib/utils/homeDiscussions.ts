import type { Notification } from "@/types/notification";
import type { HomeDiscussion } from "@/types/home";
import { toAppPostUrl } from "@/lib/utils/sanitizeUrl";

const DISCUSSION_TYPES = new Set(["COMMENTED", "QUOTED"]);

/** A same-site post path, or null for anything that isn't one. */
export function safePostPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const path = toAppPostUrl(url.trim());
  return path.startsWith("/") && !path.startsWith("//") ? path : null;
}

function toTime(created: Notification["created"]): number {
  const t = new Date(created).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/**
 * Posts of yours where people commented or quoted, newest activity first: one
 * row per post, counting the unread ones. Deleted posts are left out.
 */
export function buildDiscussions(notifications: Notification[], limit = 3): HomeDiscussion[] {
  const byPost = new Map<string, HomeDiscussion & { latest: number }>();
  const sorted = [...notifications].sort((a, b) => toTime(b.created) - toTime(a.created));

  for (const n of sorted) {
    const post = n.post;
    const url = safePostPath(post?.url);
    if (!DISCUSSION_TYPES.has(n.notificationType) || !post || post.deleted || !url) continue;
    let row = byPost.get(post._id);
    if (!row) {
      row = {
        postId: post._id,
        title: post.title?.trim() || "Your post",
        url,
        newCount: 0,
        actors: [],
        kind: n.notificationType as HomeDiscussion["kind"],
        latest: toTime(n.created),
      };
      byPost.set(post._id, row);
    }
    if (n.status === "new") row.newCount += 1;
    const actor = n.userBy;
    if (actor && !row.actors.some((a) => a.username === actor.username)) {
      row.actors.push({
        name: actor.name?.trim() || actor.username,
        username: actor.username,
        avatar: actor.avatar,
      });
    }
  }

  return [...byPost.values()]
    .sort((a, b) => b.latest - a.latest)
    .slice(0, limit)
    .map(({ latest: _latest, ...row }) => row);
}

/** "Lena Torres commented", "Jonah Kim and 4 others commented". */
export function describeDiscussion(row: HomeDiscussion): string {
  const verb = row.kind === "QUOTED" ? "quoted your post" : "commented";
  const [first, ...rest] = row.actors;
  if (!first) return row.kind === "QUOTED" ? "Someone quoted your post" : "New comments";
  if (rest.length === 0) return `${first.name} ${verb}`;
  const others = rest.length === 1 ? "1 other" : `${rest.length} others`;
  return `${first.name} and ${others} ${verb}`;
}
