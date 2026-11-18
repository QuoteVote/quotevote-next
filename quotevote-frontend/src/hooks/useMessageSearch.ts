"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";

import { SEARCH_MESSAGES } from "@/graphql/queries";
import { useDebounce } from "@/hooks/useDebounce";
import type { MessageSearchState, SearchMessagesData } from "@/types/chat";

const PAGE_SIZE = 20;
/** The API refuses longer search text. */
const MAX_TEXT_LENGTH = 200;

/**
 * Searches the text of the signed-in user's messages on the server, one page at a
 * time (#601). An empty `text` runs no query.
 */
export function useMessageSearch(rawText: string): MessageSearchState {
  const text = rawText.slice(0, MAX_TEXT_LENGTH);
  const debouncedText = useDebounce(text);
  const settled = debouncedText === text;

  const { data, loading, error, fetchMore, refetch } = useQuery<SearchMessagesData>(
    SEARCH_MESSAGES,
    {
      variables: { text: debouncedText, limit: PAGE_SIZE },
      skip: !debouncedText,
      fetchPolicy: "network-only",
    }
  );

  const [loadingMore, setLoadingMore] = useState(false);
  const [failedCursor, setFailedCursor] = useState<string | null>(null);
  const requestedCursor = useRef<string | null>(null);
  const latestText = useRef(text);
  useEffect(() => {
    latestText.current = text;
  }, [text]);

  const current = settled ? data?.searchMessages : undefined;
  const nextCursor = current?.nextCursor ?? null;

  const loadMore = useCallback(async () => {
    if (!nextCursor || requestedCursor.current === nextCursor) return;
    requestedCursor.current = nextCursor;
    setLoadingMore(true);
    setFailedCursor(null);
    try {
      await fetchMore({
        variables: { text: debouncedText, limit: PAGE_SIZE, cursor: nextCursor },
        updateQuery: (previous, { fetchMoreResult }) => {
          // The search may have changed while this page was loading.
          if (latestText.current !== debouncedText || !previous.searchMessages) return previous;
          if (!fetchMoreResult?.searchMessages) return previous;
          return {
            searchMessages: {
              ...fetchMoreResult.searchMessages,
              results: [
                ...previous.searchMessages.results,
                ...fetchMoreResult.searchMessages.results,
              ],
            },
          } as typeof previous;
        },
      });
    } catch {
      setFailedCursor(nextCursor);
    } finally {
      requestedCursor.current = null;
      setLoadingMore(false);
    }
  }, [debouncedText, fetchMore, nextCursor]);

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    matches: current?.results ?? [],
    pending: Boolean(text) && (!settled || loading),
    hasMore: nextCursor !== null,
    loadingMore,
    failed: Boolean(text) && settled && !loading && Boolean(error),
    loadMoreFailed: nextCursor !== null && failedCursor === nextCursor,
    loadMore,
    retry,
  };
}
