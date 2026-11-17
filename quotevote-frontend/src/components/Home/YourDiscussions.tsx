"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import { buildDiscussions, describeDiscussion } from "@/lib/utils/homeDiscussions";
import { useAppStore } from "@/store";
import type { Notification } from "@/types/notification";

/** Your posts with new comments or quotes, from your notifications. */
export function YourDiscussions() {
  const setNotificationsOpen = useAppStore((s) => s.setNotificationsOpen);
  const { data, loading } = useQuery<{ notifications: Notification[] }>(GET_NOTIFICATIONS, {
    fetchPolicy: "cache-first",
    errorPolicy: "all",
  });
  const rows = buildDiscussions(data?.notifications ?? []);

  return (
    <section
      aria-labelledby="home-discussions"
      className="rounded-[var(--shell-card-radius)] border-[length:var(--shell-border-w)] border-[var(--shell-line)] bg-[var(--shell-surface)] p-[18px] shadow-[var(--shell-card-shadow)]"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2
          id="home-discussions"
          className="text-[11.5px]! leading-[1.3]! font-extrabold! tracking-[0.09em]! text-[var(--shell-muted)] uppercase"
        >
          Your discussions
        </h2>
        <button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          className="cursor-pointer rounded px-1 text-[12.5px] font-bold text-[var(--shell-blue)] hover:underline"
        >
          See all
        </button>
      </div>
      {loading && rows.length === 0 ? (
        <p className="text-[13px] text-[var(--shell-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-[13px] leading-normal text-[var(--shell-muted)]">
          When people comment on or quote your posts, they show up here.
        </p>
      ) : (
        <ul>
          {rows.map((row, i) => (
            <li
              key={row.postId}
              className={i < rows.length - 1 ? "border-b border-[var(--shell-divider)]" : undefined}
            >
              <Link href={row.url} className="flex gap-2.5 px-0.5 py-2.5 no-underline">
                <DisplayAvatar
                  avatar={row.actors[0]?.avatar}
                  username={row.actors[0]?.name}
                  size={32}
                  className="size-8 flex-shrink-0"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <b className="text-[13.5px] leading-[1.35] text-[var(--shell-ink)]">
                    {row.title}
                  </b>
                  <span className="text-xs text-[var(--shell-muted)]">
                    {describeDiscussion(row)}
                  </span>
                </span>
                {row.newCount > 0 ? (
                  <span className="self-start rounded-full bg-[var(--shell-blue-soft)] px-2 py-0.5 text-[11.5px] font-extrabold whitespace-nowrap text-[var(--shell-blue-ink)]">
                    {row.newCount} new
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
