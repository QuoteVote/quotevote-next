"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { MessageSquare, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { GET_FEATURED_POSTS } from "@/graphql/queries";
import { safePostPath } from "@/lib/utils/homeDiscussions";
import { cn } from "@/lib/utils";
import type { HomeFeaturedData } from "@/types/home";

const TINTS = [
  "bg-[#eef9f3] text-[#0e8a5a]",
  "bg-[#f5f0fe] text-[#6d3fd1]",
  "bg-[#eff4ff] text-[#2457e6]",
];

function commentLabel(count: number): string {
  return count === 1 ? "1 comment" : `${count} comments`;
}

/** Three featured posts with their up and down votes and comment count. */
export function FeaturedList() {
  const { data, loading } = useQuery<HomeFeaturedData>(GET_FEATURED_POSTS, {
    variables: { limit: 3, offset: 0 },
    fetchPolicy: "cache-first",
    errorPolicy: "all",
  });
  const posts = (data?.featuredPosts?.entities ?? []).filter((p) => safePostPath(p.url));

  return (
    <section
      aria-labelledby="home-featured"
      className="rounded-[var(--shell-card-radius)] border-[length:var(--shell-border-w)] border-[var(--shell-line)] bg-[var(--shell-surface)] p-[18px] shadow-[var(--shell-card-shadow)]"
    >
      <h2
        id="home-featured"
        className="mb-2.5 flex items-center gap-1.5 text-[11.5px]! leading-[1.3]! font-extrabold! tracking-[0.09em]! text-[var(--shell-muted)] uppercase"
      >
        <Star className="size-3.5" aria-hidden="true" />
        Featured
      </h2>
      {loading && posts.length === 0 ? (
        <p className="text-[13px] text-[var(--shell-muted)]">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-[13px] text-[var(--shell-muted)]">No featured posts right now.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {posts.map((post, i) => (
            <li key={post._id}>
              <Link
                href={safePostPath(post.url) as string}
                className={cn(
                  "flex flex-col gap-2.5 rounded-xl p-3 no-underline hover:brightness-[0.97] dark:bg-[var(--shell-field)] dark:text-[var(--shell-green)]",
                  "[.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--shell-line)]",
                  TINTS[i % TINTS.length]
                )}
              >
                <span className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="font-serif text-2xl leading-none font-extrabold"
                  >
                    “
                  </span>
                  <b className="text-sm leading-[1.4] text-[var(--shell-ink)]">{post.title}</b>
                </span>
                <span className="flex items-center gap-3.5 text-[12.5px] font-bold text-[var(--shell-ink-2)]">
                  <span className="inline-flex items-center gap-1 text-[var(--shell-green)]">
                    <ThumbsUp className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Up votes:</span>
                    {post.upvotes ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--shell-down)]">
                    <ThumbsDown className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Down votes:</span>
                    {post.downvotes ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3.5" aria-hidden="true" />
                    {commentLabel(post.comments?.length ?? 0)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
