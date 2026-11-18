"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { TAGS_QUERY } from "@/graphql/queries";
import { useHomeFilters } from "@/hooks/useHomeFilters";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/components";
import type { DirectorySort, DirectoryTopic } from "@/types/directory";
import { DateRangeOptions } from "./DateRangeOptions";
import { FeedOptionsSection } from "./FeedOptionsSection";
import { InviteCard } from "./InviteCard";
import { TopicList } from "./TopicList";

const SORTS: Array<{ value: DirectorySort; label: string }> = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Most popular" },
];

const FOOTER_LINKS = [
  { href: "/about", label: "About", external: false },
  { href: "https://opencollective.com/quotevote/donate", label: "Donate", external: true },
  { href: "https://github.com/QuoteVote/quotevote-next", label: "GitHub", external: true },
  { href: "/terms", label: "Terms", external: false },
  { href: "/code-of-conduct", label: "Code of Conduct", external: false },
];

function SortControl({
  sort,
  onChange,
}: {
  sort: DirectorySort;
  onChange: (s: DirectorySort) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-0.5 rounded-[var(--shell-radius)] bg-[var(--shell-track)] p-[3px]">
      {SORTS.map((option) => {
        const on = sort === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 cursor-pointer rounded-[9px] border-0 bg-transparent text-[13px] font-bold text-[var(--shell-muted)]",
              on &&
                "bg-[var(--shell-surface)] text-[var(--shell-ink)] shadow-[0_1px_2px_rgba(15,23,42,0.1)]"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function FollowingSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border-0 bg-transparent px-0.5 py-1 text-sm font-semibold text-[var(--shell-ink-2)]"
    >
      Only people I follow
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-10 flex-shrink-0 rounded-full transition-colors",
          on ? "bg-[var(--shell-green)]" : "bg-[var(--shell-key-line)]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
            on && "translate-x-4"
          )}
        />
      </span>
    </button>
  );
}

/** Left column of the signed-in home page: sort, following, topic, date range, invite. */
export function HomeFeedOptions() {
  const filters = useHomeFilters();
  const { data } = useQuery<{ tags: Tag[] }>(TAGS_QUERY, {
    variables: { limit: 100 },
    errorPolicy: "all",
  });
  const topics: DirectoryTopic[] = (data?.tags ?? [])
    .filter((t) => t.privacy !== "private")
    .map((t) => ({ _id: t._id, title: t.title }));
  const anyActive =
    filters.sort !== "latest" ||
    filters.following ||
    !!filters.tagId ||
    !!filters.from ||
    !!filters.to;

  return (
    <aside
      aria-label="Feed options"
      data-testid="home-feed-options"
      className="font-redesign flex flex-col gap-[26px] py-8"
    >
      <FeedOptionsSection title="Sort by" id="home-sort">
        <SortControl sort={filters.sort} onChange={filters.setSort} />
      </FeedOptionsSection>
      <FeedOptionsSection title="Show" id="home-show">
        <FollowingSwitch on={filters.following} onChange={filters.setFollowing} />
      </FeedOptionsSection>
      <FeedOptionsSection title="Topic" id="home-topic">
        <TopicList topics={topics} selectedId={filters.tagId} onSelect={filters.setTopic} />
      </FeedOptionsSection>
      <FeedOptionsSection title="Date range" id="home-dates">
        <DateRangeOptions from={filters.from} to={filters.to} onChange={filters.setDates} />
      </FeedOptionsSection>
      <button
        type="button"
        onClick={filters.clearFilters}
        disabled={!anyActive}
        className="h-9 cursor-pointer self-start rounded-md px-1.5 text-[13px] font-bold text-[var(--shell-blue)] hover:underline disabled:cursor-not-allowed disabled:text-[var(--shell-muted)] disabled:no-underline disabled:opacity-60"
      >
        Clear filters
      </button>
      <div className="flex flex-col gap-3.5">
        <InviteCard />
        <nav
          aria-label="About Quote.Vote"
          className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12.5px] font-semibold"
        >
          {FOOTER_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--shell-muted)] hover:text-[var(--shell-ink)] hover:underline"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-[var(--shell-muted)] hover:text-[var(--shell-ink)] hover:underline"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </aside>
  );
}
