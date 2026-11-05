"use client";

import { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { GET_POST_TAG_ID, GET_TAG } from "@/graphql/queries";
import type { ConversationTag } from "@/types/chat";

interface PostTagIdData {
  post?: { _id: string; tagId?: string | null } | null;
}

interface TagData {
  tag?: { _id: string; title: string } | null;
}

/**
 * The tag of each discussion's post, keyed by post id (#531).
 *
 * The room list has no tag on `postDetails`, so this looks up each post's
 * `tagId` and then each distinct tag's title. Both come from the Apollo cache
 * after the first load, so the 10-second room poll adds no requests.
 * A post or tag that can't be loaded simply has no tag.
 */
export function useConversationTags(postIds: string[]): Record<string, ConversationTag> {
  const client = useApolloClient();
  const [tags, setTags] = useState<Record<string, ConversationTag>>({});
  const key = Array.from(new Set(postIds.filter(Boolean)))
    .sort()
    .join(",");

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    const ids = key.split(",");

    const load = async () => {
      const posts = await Promise.all(
        ids.map((postId) =>
          client
            .query<PostTagIdData>({
              query: GET_POST_TAG_ID,
              variables: { postId },
              fetchPolicy: "cache-first",
            })
            .then((result) => result.data?.post ?? null)
            .catch(() => null)
        )
      );

      const tagIds = Array.from(
        new Set(posts.map((post) => post?.tagId).filter((id): id is string => Boolean(id)))
      );
      const groups = await Promise.all(
        tagIds.map((tagId) =>
          client
            .query<TagData>({
              query: GET_TAG,
              variables: { tagId },
              fetchPolicy: "cache-first",
            })
            .then((result) => result.data?.tag ?? null)
            .catch(() => null)
        )
      );
      const titles = new Map(
        groups
          .filter((g): g is { _id: string; title: string } => Boolean(g?.title))
          .map((g) => [g._id, g.title])
      );

      const next: Record<string, ConversationTag> = {};
      ids.forEach((postId, i) => {
        const tagId = posts[i]?.tagId;
        const title = tagId ? titles.get(tagId) : undefined;
        if (tagId && title) next[postId] = { tagId, title };
      });
      if (!cancelled) setTags(next);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [client, key]);

  return tags;
}
