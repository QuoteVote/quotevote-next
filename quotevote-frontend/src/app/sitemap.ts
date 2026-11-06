import type { MetadataRoute } from "next";
import { getSiteUrl, toIsoDate } from "@/lib/seo/metadata";
import { getSitemapPosts } from "@/lib/seo/serverData";
import { toAppPostUrl } from "@/lib/utils/sanitizeUrl";

const SITEMAP_POST_LIMIT = 500;

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/post", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/plan", changeFrequency: "monthly", priority: 0.8 },
  { path: "/code-of-conduct", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contributing", changeFrequency: "monthly", priority: 0.5 },
  { path: "/auths/login", changeFrequency: "monthly", priority: 0.5 },
  { path: "/auths/request-access", changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const toUrl = (path: string): string => new URL(path, siteUrl).toString();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: toUrl(path),
      changeFrequency,
      priority,
    })
  );

  const posts = await getSitemapPosts(SITEMAP_POST_LIMIT);
  const seen = new Set<string>();
  const profileLastModified = new Map<string, string | undefined>();

  for (const post of posts) {
    const path = post.url ? toAppPostUrl(post.url.trim()) : "";
    if (path.startsWith("/post/") && !seen.has(path)) {
      seen.add(path);
      entries.push({
        url: toUrl(path),
        lastModified: toIsoDate(post.created),
        changeFrequency: "daily",
        priority: 0.7,
      });
    }

    const username = post.creator?.username;
    if (username && !profileLastModified.has(username)) {
      profileLastModified.set(username, toIsoDate(post.created));
    }
  }

  for (const [username, lastModified] of profileLastModified) {
    entries.push({
      url: toUrl(`/profile/${encodeURIComponent(username)}`),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
