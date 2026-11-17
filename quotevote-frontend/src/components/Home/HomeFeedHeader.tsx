"use client";

import { useQuery } from "@apollo/client/react";
import ActiveFilters from "@/components/SearchContainer/ActiveFilters";
import { GET_TAG } from "@/graphql/queries";
import { useHomeFilters } from "@/hooks/useHomeFilters";
import type { ActiveFilter } from "@/types/directory";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dateLabel(from: string, to: string): string {
  if (from && to) return `${formatDay(from)} – ${formatDay(to)}`;
  if (from) return `From ${formatDay(from)}`;
  if (to) return `Until ${formatDay(to)}`;
  return "";
}

/** Today's date, the feed title and the filters behind the results (desktop). */
export function HomeFeedHeader() {
  const filters = useHomeFilters();
  const { data } = useQuery<{ tag?: { _id: string; title: string } | null }>(GET_TAG, {
    variables: { tagId: filters.tagId },
    skip: !filters.tagId,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });
  const topicTitle = data?.tag?.title;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const active: ActiveFilter[] = [
    { key: "q", label: "Search", value: filters.q, onRemove: () => filters.setSearch("") },
    {
      key: "tag",
      label: "Topic",
      value: filters.tagId ? (topicTitle ? `#${topicTitle}` : "Selected") : "",
      onRemove: () => filters.setTopic(""),
    },
    {
      key: "following",
      label: "Feed",
      value: filters.following ? "Following" : "",
      onRemove: () => filters.setFollowing(false),
    },
    {
      key: "date",
      label: "Date",
      value: dateLabel(filters.from, filters.to),
      onRemove: () => filters.setDates("", ""),
    },
  ];

  return (
    <div className="font-redesign flex flex-col gap-3 pt-8 pb-1">
      <div>
        <p className="mb-1.5 text-xs font-bold tracking-[0.09em] text-[var(--shell-muted)] uppercase">
          {today}
        </p>
        <h1 className="text-[34px]! leading-[1.08]! font-extrabold! tracking-[-0.03em]! text-[var(--shell-ink)]">
          {filters.sort === "popular" ? "Most popular quotes" : "Latest quotes"}
        </h1>
      </div>
      <ActiveFilters filters={active} onClearAll={filters.clearAll} />
    </div>
  );
}
