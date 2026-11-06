import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  buildPageMetadata,
  decodeParam,
  pageTitle,
  toDescription,
  toIsoDate,
  SITE_NAME,
} from "@/lib/seo/metadata";
import { buildPostJsonLd } from "@/lib/seo/jsonLd";
import { getPostForMetadata } from "@/lib/seo/serverData";
import { toAppPostUrl } from "@/lib/utils/sanitizeUrl";
import { JsonLd } from "@/components/common/JsonLd";
import type { PostMetadataData } from "@/types/seo";
import PostPageContent from "./PostPageContent";

interface PostPageParams {
  group: string;
  title: string;
  postId: string;
}

interface PostPageProps {
  params: Promise<PostPageParams>;
}

function resolvePostPath(
  { group, title, postId }: PostPageParams,
  post: PostMetadataData | null | undefined
): string {
  const postUrl = post?.url ? toAppPostUrl(post.url.trim()) : "";
  return postUrl.startsWith("/post/")
    ? postUrl
    : `/post/${[group, title, postId].map((s) => encodeURIComponent(decodeParam(s))).join("/")}`;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const routeParams = await params;
  const post = await getPostForMetadata(decodeParam(routeParams.postId));
  const path = resolvePostPath(routeParams, post);

  // A missing or deleted post must not stay indexable; an API outage keeps the generic fallback.
  if (!post) {
    return buildPageMetadata({
      title: pageTitle("Post"),
      description: `Read this post and join the discussion on ${SITE_NAME}.`,
      path,
      type: "article",
      noIndex: post === null,
    });
  }

  const author = post.creator?.username ? `@${post.creator.username}` : null;
  const description = post.text?.trim()
    ? toDescription(post.text)
    : `A post${author ? ` by ${author}` : ""} on ${SITE_NAME}.`;

  return buildPageMetadata({
    title: pageTitle(post.title?.trim() || "Post"),
    description,
    path,
    type: "article",
    publishedTime: toIsoDate(post.created),
  });
}

export default async function PostPage({ params }: PostPageProps): Promise<ReactNode> {
  const routeParams = await params;
  const post = await getPostForMetadata(decodeParam(routeParams.postId));

  return (
    <>
      {post && <JsonLd data={buildPostJsonLd(post, resolvePostPath(routeParams, post))} />}
      <PostPageContent />
    </>
  );
}
