import type { DirectorySort } from "@/types/directory";

/** URL-driven filters of the signed-in home feed. */
export interface HomeFilters {
  q: string;
  from: string;
  to: string;
  sort: DirectorySort;
  following: boolean;
  tagId: string;
}

export interface HomeFilterActions {
  setSort: (sort: DirectorySort) => void;
  setFollowing: (following: boolean) => void;
  setTopic: (tagId: string) => void;
  setDates: (from: string, to: string) => void;
  setSearch: (q: string) => void;
  clearFilters: () => void;
  /** Clears the search too. */
  clearAll: () => void;
}

export type UseHomeFiltersResult = HomeFilters & HomeFilterActions;

/** A quick date range in the left column. */
export interface QuickRange {
  key: "day" | "week" | "month";
  label: string;
  days: number;
}

/** A featured post as the right column shows it. */
export interface HomeFeaturedPost {
  _id: string;
  title: string;
  url?: string | null;
  upvotes?: number | null;
  downvotes?: number | null;
  comments?: Array<{ _id: string }> | null;
}

export interface HomeFeaturedData {
  featuredPosts?: { entities?: HomeFeaturedPost[] | null } | null;
}

/** One post with new activity in "Your discussions". */
export interface HomeDiscussion {
  postId: string;
  title: string;
  url: string;
  newCount: number;
  /** Who acted, most recent first, without repeats. */
  actors: Array<{ name: string; username: string; avatar?: string | Record<string, unknown> }>;
  kind: "COMMENTED" | "QUOTED";
}
