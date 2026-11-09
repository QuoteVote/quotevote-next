import { act, renderHook } from "@testing-library/react";

import { useMessageSearch } from "@/hooks/useMessageSearch";
import { SEARCH_MESSAGES } from "@/graphql/queries";

const mockUseQuery = jest.fn();
jest.mock("@apollo/client/react", () => ({
  ...jest.requireActual("@apollo/client/react"),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

const hit = (id: string) => ({
  _id: id,
  messageRoomId: "room-1",
  created: "2026-11-01T10:00:00Z",
  snippet: `snippet ${id}`,
});

describe("useMessageSearch", () => {
  const fetchMore = jest.fn();
  const refetch = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: { searchMessages: { results: [hit("a")], nextCursor: "next" } },
      loading: false,
      fetchMore,
      refetch,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("runs no query for empty text", () => {
    renderHook(() => useMessageSearch(""));
    expect(mockUseQuery).toHaveBeenCalledWith(
      SEARCH_MESSAGES,
      expect.objectContaining({ skip: true })
    );
  });

  it("waits for typing to stop, and hides the old results meanwhile", () => {
    const { result, rerender } = renderHook(({ text }) => useMessageSearch(text), {
      initialProps: { text: "town" },
    });
    expect(result.current.matches).toHaveLength(1);

    rerender({ text: "town h" });
    expect(mockUseQuery.mock.lastCall?.[1].variables.text).toBe("town");
    expect(result.current.matches).toEqual([]);
    expect(result.current.pending).toBe(true);
    expect(result.current.hasMore).toBe(false);

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(mockUseQuery.mock.lastCall?.[1].variables.text).toBe("town h");
    expect(result.current.pending).toBe(false);
  });

  it("caps the text at what the API accepts", () => {
    renderHook(() => useMessageSearch("x".repeat(250)));
    expect(mockUseQuery.mock.lastCall?.[1].variables.text).toHaveLength(200);
  });

  it("appends the next page and takes its cursor", async () => {
    fetchMore.mockResolvedValue({});
    const { result } = renderHook(() => useMessageSearch("town"));
    await act(() => result.current.loadMore());

    const { updateQuery, variables } = fetchMore.mock.calls[0][0];
    expect(variables).toEqual(expect.objectContaining({ text: "town", cursor: "next" }));
    expect(
      updateQuery(
        { searchMessages: { results: [hit("a")], nextCursor: "next" } },
        { fetchMoreResult: { searchMessages: { results: [hit("b")], nextCursor: null } } }
      )
    ).toEqual({ searchMessages: { results: [hit("a"), hit("b")], nextCursor: null } });
  });

  it("drops a page that arrives after the search changed", async () => {
    fetchMore.mockResolvedValue({});
    const { result, rerender } = renderHook(({ text }) => useMessageSearch(text), {
      initialProps: { text: "town" },
    });
    await act(() => result.current.loadMore());
    rerender({ text: "parking" });

    const previous = { searchMessages: { results: [hit("p")], nextCursor: null } };
    expect(
      fetchMore.mock.calls[0][0].updateQuery(previous, {
        fetchMoreResult: { searchMessages: { results: [hit("b")], nextCursor: null } },
      })
    ).toBe(previous);
  });

  it("does not request the same page twice at once", async () => {
    let finish: (value: unknown) => void = () => {};
    fetchMore.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { result } = renderHook(() => useMessageSearch("town"));

    await act(async () => {
      void result.current.loadMore();
      void result.current.loadMore();
    });
    expect(fetchMore).toHaveBeenCalledTimes(1);
    await act(async () => finish({}));
  });

  it("reports a failed page for that cursor only", async () => {
    fetchMore.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useMessageSearch("town"));
    await act(() => result.current.loadMore());
    expect(result.current.loadMoreFailed).toBe(true);
    expect(result.current.loadingMore).toBe(false);
  });

  it("reports a failed search", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error("x"),
      fetchMore,
      refetch,
    });
    const { result } = renderHook(() => useMessageSearch("town"));
    expect(result.current.failed).toBe(true);
    result.current.retry();
    expect(refetch).toHaveBeenCalled();
  });
});
