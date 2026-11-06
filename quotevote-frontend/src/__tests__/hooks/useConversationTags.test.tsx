/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing/react";
import type { ReactNode } from "react";
import { useConversationTags } from "@/hooks/useConversationTags";
import { GET_TAG, GET_POST_TAG_ID } from "@/graphql/queries";

const postMock = (postId: string, tagId: string | null) => ({
  request: { query: GET_POST_TAG_ID, variables: { postId } },
  result: { data: { post: { __typename: "Post", _id: postId, tagId } } },
});
const tagMock = (tagId: string, title: string) => ({
  request: { query: GET_TAG, variables: { tagId } },
  result: { data: { tag: { __typename: "Tag", _id: tagId, title } } },
});

const wrapper = (mocks: unknown[]) => {
  function Wrapper({ children }: { children: ReactNode }) {
    return <MockedProvider mocks={mocks as never}>{children}</MockedProvider>;
  }
  return Wrapper;
};

describe("useConversationTags (#531)", () => {
  it("maps each post to its group's title, loading each group once", async () => {
    const mocks = [
      postMock("p1", "g1"),
      postMock("p2", "g1"),
      postMock("p3", "g2"),
      tagMock("g1", "Climate"),
      tagMock("g2", "Housing"),
    ];
    const { result } = renderHook(() => useConversationTags(["p1", "p2", "p3", "p1"]), {
      wrapper: wrapper(mocks),
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        p1: { tagId: "g1", title: "Climate" },
        p2: { tagId: "g1", title: "Climate" },
        p3: { tagId: "g2", title: "Housing" },
      });
    });
  });

  it("leaves out posts without a group, and posts or groups that fail to load", async () => {
    const mocks = [
      postMock("p1", null),
      {
        request: { query: GET_POST_TAG_ID, variables: { postId: "p2" } },
        error: new Error("404"),
      },
      postMock("p3", "g9"),
      { request: { query: GET_TAG, variables: { tagId: "g9" } }, error: new Error("gone") },
      postMock("p4", "g1"),
      tagMock("g1", "Climate"),
    ];
    const { result } = renderHook(() => useConversationTags(["p1", "p2", "p3", "p4"]), {
      wrapper: wrapper(mocks),
    });

    await waitFor(() => {
      expect(result.current).toEqual({ p4: { tagId: "g1", title: "Climate" } });
    });
  });

  it("asks for nothing when there are no discussions", () => {
    const { result } = renderHook(() => useConversationTags([]), { wrapper: wrapper([]) });
    expect(result.current).toEqual({});
  });
});
