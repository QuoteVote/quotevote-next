import { cache } from "react";
import { print } from "graphql";
import type { DocumentNode } from "graphql";
import { GET_POST_METADATA, GET_SITEMAP_POSTS, GET_USER_METADATA } from "@/graphql/queries";
import { getGraphqlServerUrl } from "@/lib/utils/getServerUrl";
import type {
  GraphqlResponse,
  PostMetadataData,
  SitemapPostData,
  UserMetadataData,
} from "@/types/seo";

// Page metadata blocks crawler responses, so keep it short; the sitemap regenerates in the background.
const METADATA_TIMEOUT_MS = 3000;
const SITEMAP_TIMEOUT_MS = 10000;
const REVALIDATE_SECONDS = 300;

// Never throws, so metadata can't break a page render.
// Resolves to `undefined` when the API couldn't be asked (network error, timeout, unexpected
// status, unreadable body) and to `null` when it answered 404 without data. Legacy answers a
// missing or deleted post with a 404, so that body is still read.
async function queryPublicGraphql<TData>(
  query: DocumentNode,
  variables: Record<string, unknown>,
  timeoutMs: number = METADATA_TIMEOUT_MS
): Promise<TData | null | undefined> {
  try {
    const response = await fetch(getGraphqlServerUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: print(query), variables }),
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const notFound = response.status === 404;
    if (!response.ok && !notFound) return undefined;

    const json = (await response.json()) as GraphqlResponse<TData>;
    if (json.data) return json.data;
    return notFound ? null : undefined;
  } catch {
    return undefined;
  }
}

// `null`: the post doesn't exist. `undefined`: the API couldn't be reached.
export const getPostForMetadata = cache(
  async (postId: string): Promise<PostMetadataData | null | undefined> => {
    const data = await queryPublicGraphql<{ post: PostMetadataData | null }>(GET_POST_METADATA, {
      postId,
    });
    return data === undefined ? undefined : (data?.post ?? null);
  }
);

// `null`: the user doesn't exist. `undefined`: the API couldn't be reached.
export const getUserForMetadata = cache(
  async (username: string): Promise<UserMetadataData | null | undefined> => {
    const data = await queryPublicGraphql<{ user: UserMetadataData | null }>(GET_USER_METADATA, {
      username,
    });
    return data === undefined ? undefined : (data?.user ?? null);
  }
);

export async function getSitemapPosts(limit: number): Promise<SitemapPostData[]> {
  const data = await queryPublicGraphql<{ posts: { entities: SitemapPostData[] } | null }>(
    GET_SITEMAP_POSTS,
    { limit, offset: 0, searchKey: "" },
    SITEMAP_TIMEOUT_MS
  );
  return data?.posts?.entities ?? [];
}
