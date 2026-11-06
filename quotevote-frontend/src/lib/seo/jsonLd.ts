import { parseAvatarToUrl } from "@/lib/avatar";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  getSiteUrl,
  toDescription,
  toIsoDate,
} from "@/lib/seo/metadata";
import type { JsonLdObject, PostMetadataData, UserMetadataData } from "@/types/seo";

const SCHEMA_CONTEXT = "https://schema.org";
const ORGANIZATION_LOGO_PATH = "/icons/android-chrome-512x512.png";
const MAX_HEADLINE_LENGTH = 110;

function absoluteUrl(path: string): string {
  return new URL(path, getSiteUrl()).toString();
}

function organization(): JsonLdObject {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl(ORGANIZATION_LOGO_PATH),
  };
}

// Post and profile fields are user content: escaping "<" keeps it from closing the <script> tag.
export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildWebSiteJsonLd(): JsonLdObject {
  const homeUrl = absoluteUrl("/");
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${homeUrl}#website`,
        name: SITE_NAME,
        url: homeUrl,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${homeUrl}#organization` },
      },
      { ...organization(), "@id": `${homeUrl}#organization` },
    ],
  };
}

export function buildPostJsonLd(post: PostMetadataData, path: string): JsonLdObject {
  const url = absoluteUrl(path);
  const username = post.creator?.username;
  const author: JsonLdObject = username
    ? {
        "@type": "Person",
        name: post.creator?.name?.trim() || `@${username}`,
        url: absoluteUrl(`/profile/${encodeURIComponent(username)}`),
      }
    : organization();

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    headline: toDescription(post.title?.trim() || "Post", MAX_HEADLINE_LENGTH),
    description: post.text?.trim() ? toDescription(post.text) : undefined,
    url,
    mainEntityOfPage: url,
    image: [absoluteUrl(DEFAULT_OG_IMAGE.url)],
    datePublished: toIsoDate(post.created),
    author: [author],
    publisher: organization(),
  };
}

export function buildProfileJsonLd(user: UserMetadataData): JsonLdObject {
  const url = absoluteUrl(`/profile/${encodeURIComponent(user.username)}`);
  const handle = `@${user.username}`;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ProfilePage",
    url,
    mainEntity: {
      "@type": "Person",
      name: user.name?.trim() || handle,
      alternateName: handle,
      identifier: user._id,
      url,
      image: parseAvatarToUrl(user.avatar),
    },
  };
}
