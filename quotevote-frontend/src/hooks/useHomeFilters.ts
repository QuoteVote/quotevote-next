"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTagIdParam } from "@/lib/utils/tagParam";
import type { DirectorySort } from "@/types/directory";
import type { UseHomeFiltersResult } from "@/types/home";

/**
 * The home feed's filters live in the URL (same parameters as the toolbar,
 * #515), so the left column, the header search and the phone toolbar stay in step.
 */
export function useHomeFilters(): UseHomeFiltersResult {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, val]) => {
        if (val !== null && val !== "") params.set(key, val);
        else params.delete(key);
      });
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [router, searchParams]
  );

  const sort: DirectorySort = searchParams.get("interactions") === "true" ? "popular" : "latest";

  return {
    q: searchParams.get("q") || "",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    sort,
    following: searchParams.get("following") === "true",
    tagId: getTagIdParam(searchParams),
    setSort: (next) =>
      updateParams({ interactions: next === "popular" ? "true" : null, sort: null }),
    setFollowing: (next) => updateParams({ following: next ? "true" : null }),
    setTopic: (tagId) => updateParams({ tag: tagId || null, group: null }),
    setDates: (from, to) => updateParams({ from: from || null, to: to || null }),
    setSearch: (q) => updateParams({ q: q.trim() || null }),
    clearAll: () =>
      updateParams({
        q: null,
        interactions: null,
        sort: null,
        following: null,
        tag: null,
        group: null,
        from: null,
        to: null,
      }),
    clearFilters: () =>
      updateParams({
        interactions: null,
        sort: null,
        following: null,
        tag: null,
        group: null,
        from: null,
        to: null,
      }),
  };
}
