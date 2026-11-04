"use client";

import { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { GET_POST_GROUP_ID, GET_TAG } from "@/graphql/queries";
import type { ConversationTag } from "@/types/chat";

interface PostGroupIdData {
  post?: { _id: string; groupId?: string | null } | null;
}

interface TagData {
  tag?: { _id: string; title: string } | null;
}

/**
 * The tag of each discussion's post, keyed by post id (#531).
 *
 * The live API's room list has no group on `postDetails`, so this looks up each
 * post's `groupId` and then each distinct group's title. Both come from the
 * Apollo cache after the first load, so the 10-second room poll adds no requests.
 * A post or group that can't be loaded simply has no tag.
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
            .query<PostGroupIdData>({
              query: GET_POST_GROUP_ID,
              variables: { postId },
              fetchPolicy: "cache-first",
            })
            .then((result) => result.data?.post ?? null)
            .catch(() => null)
        )
      );

      const groupIds = Array.from(
        new Set(posts.map((post) => post?.groupId).filter((id): id is string => Boolean(id)))
      );
      const groups = await Promise.all(
        groupIds.map((groupId) =>
          client
            .query<TagData>({
              query: GET_TAG,
              variables: { tagId: groupId },
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
        const groupId = posts[i]?.groupId;
        const title = groupId ? titles.get(groupId) : undefined;
        if (groupId && title) next[postId] = { groupId, title };
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
