"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { Skeleton } from "@/components/ui/skeleton";
import { DisplayAvatar } from "@/components/DisplayAvatar";
import { GET_TAG, GET_TOP_POSTS, TAGS_QUERY } from "@/graphql/queries";
import { createGraphQLVariables, extractPaginationData } from "@/lib/utils/pagination";
import { parseApiDate } from "@/lib/utils/apiDate";
import type { PaginatedPostsListData, Post } from "@/types/post";
import type { LandingPagerProps, LandingPostCardProps, LandingSort } from "@/types/access";

const PAGE_SIZE = 20;
const TAG_COLORS = ["green", "blue", "purple"] as const;
const BAR_COLORS: Record<(typeof TAG_COLORS)[number], string> = {
  green: "#16a06a",
  blue: "#2f66f0",
  purple: "#7c4ddb",
};

/** A tag keeps the same colour everywhere: green, blue or purple. */
function tagColor(title: string): (typeof TAG_COLORS)[number] {
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_COLORS[hash % TAG_COLORS.length];
}

/** "3h ago", "Yesterday", "2 days ago", then the date. */
function postAge(value: string | number | undefined): string {
  const date = parseApiDate(value ?? null);
  if (!date) return "";
  const hours = (Date.now() - date.getTime()) / 36e5;
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function LandingPostCard({ post }: LandingPostCardProps) {
  const { data } = useQuery<{ tag?: { _id: string; title: string } | null }>(GET_TAG, {
    variables: { tagId: post.tagId || "" },
    skip: !post.tagId,
    errorPolicy: "all",
  });
  const tag = data?.tag?.title ?? null;
  const color = tag ? tagColor(tag) : "green";
  const approved = post.approvedBy?.length ?? 0;
  const rejected = post.rejectedBy?.length ?? 0;
  const total = approved + rejected;
  const pct = total > 0 ? Math.round((approved / total) * 100) : null;
  const href = post.url || `/post/x/x/${post._id}`;
  const domain = post.citationUrl ? sourceDomain(post.citationUrl) : "";
  const creator = post.creator;

  return (
    <article className="qv-lit flex flex-col gap-3 px-4 pt-4 pb-3.5 lg:px-[22px] lg:pt-5 lg:pb-[18px]">
      <div className="flex items-center gap-2.5 text-[13px] text-[var(--auth-muted)]">
        <DisplayAvatar
          avatar={creator?.avatar as string | Record<string, unknown> | undefined}
          username={creator?.username || ""}
          size={36}
          className="size-7 lg:size-9"
        />
        <span className="flex min-w-0 flex-col">
          <b className="truncate text-sm text-[var(--auth-ink)]">
            {creator?.name || creator?.username}
          </b>
          <span className="hidden lg:inline">
            @{creator?.username} · {postAge(post.created)}
          </span>
        </span>
        <span className="ml-auto flex shrink-0 gap-1.5">
          {tag && <span className={`qv-pub-chip qv-pub-chip-${color}`}># {tag}</span>}
          {domain && (
            <a
              href={post.citationUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="qv-pub-chip-outline max-lg:hidden!"
            >
              Source: {domain}
            </a>
          )}
        </span>
      </div>
      <h3 className="qv-auth-display m-0 text-[18px]! tracking-[-0.02em]! lg:text-[23px]!">
        <Link href={href} className="text-[var(--auth-ink)] no-underline hover:underline">
          {post.title}
        </Link>
      </h3>
      {post.text && (
        <p className="m-0 line-clamp-3 hidden text-base leading-[1.65]! text-[var(--ra-body)] lg:block">
          “{post.text}”
        </p>
      )}
      <div className="flex items-center gap-3">
        <span className="qv-pub-bar flex-1" aria-hidden="true">
          {pct !== null && <span style={{ width: `${pct}%`, background: BAR_COLORS[color] }} />}
        </span>
        <b className="text-[13px] whitespace-nowrap">
          {pct === null ? (
            "No votes yet"
          ) : (
            <>
              {pct}%<span className="hidden lg:inline"> approve</span>
            </>
          )}
        </b>
        <Link
          href={href}
          className="qv-auth-link ml-2 hidden text-[13.5px] font-extrabold lg:inline"
        >
          Open post →
        </Link>
      </div>
    </article>
  );
}

function pageNumbers(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const start = Math.max(1, Math.min(page - 1, totalPages - 3));
  const nums: (number | "gap")[] = [start, start + 1, start + 2, start + 3];
  if (nums[3] !== totalPages) nums.push("gap", totalPages);
  return nums;
}

function LandingPager({ page, totalPages, total, pageSize, onPage }: LandingPagerProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const chevron = (d: string) => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
  return (
    <nav className="qv-pub-pager mt-1.5" aria-label="Pages">
      <span className="flex min-w-[96px] flex-col gap-[7px] text-[13px] font-semibold text-[var(--auth-muted)] lg:min-w-[170px]">
        <span>
          <b className="text-[var(--auth-ink)]">
            {from}–{to}
          </b>{" "}
          of {total}
          <span className="hidden lg:inline"> posts</span>
        </span>
        <span className="qv-inv-track hidden lg:block" aria-hidden="true">
          <span style={{ width: `${total ? Math.max(2, (to / total) * 100) : 0}%` }} />
        </span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="qv-pub-pg-icon max-lg:hidden!"
          aria-label="First page"
          disabled={page <= 1}
          onClick={() => onPage(1)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden="true"
          >
            <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />
          </svg>
        </button>
        <button
          type="button"
          className="qv-auth-btn h-10! rounded-[12px] px-2.5! lg:px-3.5!"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          {chevron("M15 18l-6-6 6-6")}
          <span className="hidden lg:inline">Previous</span>
        </button>
        <div className="qv-pub-pg-nums">
          {pageNumbers(page, totalPages).map((n, i) =>
            n === "gap" ? (
              <span key={`gap-${i}`} className="qv-pub-pg-gap max-lg:hidden" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                className={i >= 3 ? "qv-pub-pg max-lg:hidden" : "qv-pub-pg"}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          className="qv-auth-btn h-10! rounded-[12px] px-2.5! lg:px-3.5!"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden lg:inline">Next</span>
          {chevron("M9 18l6-6-6-6")}
        </button>
        <button
          type="button"
          className="qv-pub-pg-icon max-lg:hidden!"
          aria-label="Last page"
          disabled={page >= totalPages}
          onClick={() => onPage(totalPages)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden="true"
          >
            <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

/** "Latest quotes": the public posts, newest first, with search, filters, topics and pages. */
export function LandingFeed() {
  const initialSearch = useSearchParams().get("q")?.trim() ?? "";
  const [draft, setDraft] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [tagId, setTagId] = useState<string | undefined>();
  const [sort, setSort] = useState<LandingSort>("desc");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [panel, setPanel] = useState<"filters" | "dates" | null>(null);

  const { data: tagsData } = useQuery<{ tags: { _id: string; title: string }[] }>(TAGS_QUERY, {
    variables: { limit: 5 },
  });
  const { data, loading, error } = useQuery<PaginatedPostsListData>(GET_TOP_POSTS, {
    variables: createGraphQLVariables({
      page,
      pageSize: PAGE_SIZE,
      searchKey: search,
      startDateRange: from || undefined,
      endDateRange: to || undefined,
      sortOrder: sort === "asc" ? "asc" : "desc",
      interactions: sort === "popular",
      tagId,
    }),
    fetchPolicy: "cache-and-network",
  });
  const extracted = extractPaginationData<Post>(
    data as unknown as Record<string, unknown>,
    "posts"
  );
  const posts = extracted.data ?? [];
  const pagination = extracted.pagination ?? { total: 0, totalPages: 0 };

  const go = (n: number) => {
    setPage(n);
    document.getElementById("feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const toggle = (p: "filters" | "dates") => setPanel((cur) => (cur === p ? null : p));

  return (
    <section
      id="feed"
      className="mx-auto flex w-full max-w-[880px] scroll-mt-20 flex-col gap-3 px-4 pt-14 sm:px-8 lg:gap-4 lg:px-0 lg:pt-24"
    >
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-3">
          <span className="qv-pub-kicker">Explore</span>
          <h2 className="qv-auth-display m-0 text-[30px]! lg:text-[40px]!">Latest quotes</h2>
        </div>
        <span className="qv-auth-muted hidden text-[13px] font-bold lg:inline">
          Newest first · no ranking
        </span>
      </div>

      <form
        role="search"
        className="flex items-center gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(draft.trim());
          setPage(1);
        }}
      >
        <label htmlFor="landing-search" className="sr-only">
          Search quotes, topics and sources
        </label>
        <div className="flex h-[46px] flex-1 items-center gap-2.5 rounded-[14px] border border-[var(--pub-line-2)] bg-[var(--auth-surface)] px-4 focus-within:border-[var(--auth-focus-line)] focus-within:shadow-[var(--auth-focus-ring)] lg:h-[52px] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-[var(--auth-muted)]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="landing-search"
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search quotes, topics and sources"
            className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-[var(--auth-ink)] outline-none placeholder:text-[var(--auth-muted)]"
          />
        </div>
        <button
          type="button"
          className="qv-pub-pill max-lg:hidden!"
          aria-expanded={panel === "filters"}
          aria-controls="landing-filters"
          onClick={() => toggle("filters")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          Filters
        </button>
        <button
          type="button"
          className="qv-pub-pill max-lg:hidden!"
          aria-expanded={panel === "dates"}
          aria-controls="landing-dates"
          onClick={() => toggle("dates")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          Date range
        </button>
      </form>

      {panel === "filters" && (
        <div
          id="landing-filters"
          className="qv-pub-panel flex flex-wrap items-center gap-2 p-3"
          role="group"
          aria-label="Sort posts"
        >
          {(
            [
              ["desc", "Newest first"],
              ["asc", "Oldest first"],
              ["popular", "Most popular"],
            ] as [LandingSort, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={sort === value}
              className="qv-pub-chip qv-pub-chip-blue"
              onClick={() => {
                setSort(value);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {panel === "dates" && (
        <div id="landing-dates" className="qv-pub-panel flex flex-wrap items-end gap-3 p-3">
          <label className="flex flex-col gap-1 text-[13px] font-bold">
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="qv-auth-input h-10!"
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-bold">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="qv-auth-input h-10!"
            />
          </label>
          {(from || to) && (
            <button
              type="button"
              className="qv-auth-btn qv-auth-btn-sm qv-auth-btn-ghost"
              onClick={() => {
                setFrom("");
                setTo("");
                setPage(1);
              }}
            >
              Clear dates
            </button>
          )}
        </div>
      )}

      {(tagsData?.tags?.length ?? 0) > 0 && (
        <div className="hidden flex-wrap gap-2 lg:flex" role="group" aria-label="Topics">
          {tagsData!.tags.map((t) => (
            <button
              key={t._id}
              type="button"
              aria-pressed={tagId === t._id}
              className={`qv-pub-chip qv-pub-chip-${tagColor(t.title)}`}
              onClick={() => {
                setTagId((cur) => (cur === t._id ? undefined : t._id));
                setPage(1);
              }}
            >
              # {t.title}
            </button>
          ))}
        </div>
      )}

      {error && !data ? (
        <p role="alert" className="qv-pub-panel qv-auth-err m-0 p-5 text-sm!">
          Posts couldn’t load. Please try again in a moment.
        </p>
      ) : loading && !data ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-40 w-full rounded-[18px]" />
          <Skeleton className="h-40 w-full rounded-[18px]" />
        </div>
      ) : posts.length === 0 ? (
        <p className="qv-pub-panel qv-auth-muted m-0 p-6 text-center font-semibold">
          No posts match. Try another search or topic.
        </p>
      ) : (
        <div className="flex flex-col gap-3 lg:gap-4" data-post-list>
          {/* Phones show the newest post, as in the phone design */}
          {posts.map((post, i) => (
            <div key={post._id} className={i > 0 ? "hidden lg:block" : undefined}>
              <LandingPostCard post={post} />
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <LandingPager
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={PAGE_SIZE}
          onPage={go}
        />
      )}
    </section>
  );
}
