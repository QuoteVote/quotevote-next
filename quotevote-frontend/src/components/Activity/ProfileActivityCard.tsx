"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { GET_TAG } from "@/graphql/queries";
import { parseApiDate } from "@/lib/utils/apiDate";
import type { ProfileActivityCardProps } from "@/types/profile";

/* One activity item on a profile, from the updated design (Profile): a card lit in
   the colour of what happened, a tag, the date, and the words it was about. Posts use
   the live app's post card shape and show plain up and down votes. */

const KINDS: Record<
  string,
  { light: string; tag: string; label: string; fill: boolean; link?: "in" | "on" }
> = {
  POSTED: { light: "post", tag: "qv-tag-info", label: "Posted", fill: false },
  UPVOTED: { light: "up", tag: "qv-tag-up", label: "↑ Upvoted", fill: true, link: "in" },
  // A vote whose record didn't come back: say it was a vote and show the post.
  VOTED: { light: "up", tag: "qv-tag-up", label: "Voted", fill: true },
  DOWNVOTED: { light: "down", tag: "qv-tag-down", label: "↓ Downvoted", fill: true, link: "in" },
  COMMENTED: {
    light: "comment",
    tag: "qv-tag-comment",
    label: "Commented",
    fill: true,
    link: "on",
  },
  QUOTED: { light: "quote", tag: "qv-tag-quote", label: "“ Quoted", fill: true, link: "in" },
  LIKED: { light: "like", tag: "qv-tag-like", label: "♥ Liked", fill: true, link: "in" },
};

/** "Today", "Yesterday", then "Nov 10" (and the year once it isn't this year). */
export function activityDate(value: string | number): string {
  const date = parseApiDate(value);
  if (!date) return "";
  const today = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(today) - start(date)) / 864e5);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  });
}

export function ProfileActivityCard({
  type,
  post,
  created,
  passage,
  commentText,
  href,
}: ProfileActivityCardProps) {
  const kind = KINDS[type] ?? { ...KINDS.POSTED, label: "Activity" };
  const isPost = type === "POSTED";
  const { data } = useQuery<{ tag?: { _id: string; title: string } | null }>(GET_TAG, {
    variables: { tagId: post.tagId || "" },
    skip: !isPost || !post.tagId,
    errorPolicy: "all",
  });
  const tag = data?.tag?.title;
  const up = post.upvotes ?? 0;
  const down = post.downvotes ?? 0;
  const comments = post.comments?.length ?? 0;
  const title = post.title || "this post";

  return (
    <article
      aria-label={`${type.toLowerCase()}: ${post.title || passage || "activity"}`}
      className={`${isPost ? "qv-postcard" : "qv-lit"} flex flex-col gap-1.5 px-3.5 py-3 font-redesign lg:gap-2 lg:px-5 lg:py-4`}
      data-light={kind.light === "post" ? undefined : kind.light}
      data-fill={kind.fill || undefined}
      data-profile-activity="true"
      data-testid="activity-card"
    >
      <div className="flex items-center gap-2">
        <span className={`qv-tag ${kind.tag}`}>{kind.label}</span>
        {tag && (
          <span className="qv-pub-chip qv-pub-chip-green h-6! text-[11.5px]! max-lg:hidden!">
            # {tag}
          </span>
        )}
        <span className="ml-auto text-[12.5px] font-semibold text-[var(--shell-muted)]">
          {activityDate(created)}
        </span>
      </div>

      {isPost ? (
        <>
          <Link
            href={href}
            className="qv-auth-display text-[15.5px]! leading-[1.35]! tracking-[-0.02em]! text-[var(--shell-ink)] no-underline hover:underline lg:text-[21px]! lg:leading-[1.08]!"
          >
            {post.title || post.text}
          </Link>
          <div className="flex items-center gap-3 text-[12.5px] font-extrabold lg:gap-3.5 lg:text-[13px]">
            <span className="text-[#0e8a5a]">
              <span aria-hidden="true">↑</span>
              <span className="sr-only">Up votes:</span> {up}
            </span>
            <span className="text-[#c42b2b]">
              <span aria-hidden="true">↓</span>
              <span className="sr-only">Down votes:</span> {down}
            </span>
            <span className="text-[var(--shell-ink-2)]">
              {comments} {comments === 1 ? "comment" : "comments"}
            </span>
          </div>
        </>
      ) : !KINDS[type] || type === "VOTED" ? (
        <Link
          href={href}
          className="text-[15px] font-semibold text-[var(--shell-ink)] no-underline hover:underline lg:text-base"
        >
          {post.title || passage}
        </Link>
      ) : type === "COMMENTED" ? (
        <p className="m-0 text-sm leading-[1.5]! lg:text-[15px] lg:leading-[1.55]!">
          {commentText || passage}
        </p>
      ) : (
        <p className="m-0 text-[15px] leading-snug! font-semibold lg:text-base">“{passage}”</p>
      )}

      {kind.link && (
        <span className="text-[13px] font-semibold text-[var(--shell-muted)] max-lg:hidden">
          {kind.link}{" "}
          <Link href={href} className="text-[var(--shell-blue)] no-underline hover:underline">
            {title}
          </Link>
        </span>
      )}
    </article>
  );
}
