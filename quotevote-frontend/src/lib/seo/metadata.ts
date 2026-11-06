import type { Metadata } from "next";
import type { PageMetadataInput } from "@/types/seo";

export const SITE_NAME = "Quote.Vote";

export const DEFAULT_DESCRIPTION =
  "An open-source, text-only social platform for thoughtful dialogue. Every post creates its own chatroom where people can quote, vote, and respond in real time.";

export const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Quote.Vote — a text-first platform for thoughtful public dialogue",
};

const MAX_DESCRIPTION_LENGTH = 160;

export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return new URL(`https://${vercelProduction}`);

  return new URL("http://localhost:3000");
}

export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function pageTitle(name: string): string {
  return `${name} — ${SITE_NAME}`;
}

export function toDescription(text: string, maxLength: number = MAX_DESCRIPTION_LENGTH): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= maxLength) return collapsed;

  const cut = collapsed.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function toIsoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  noIndex = false,
  publishedTime,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type,
      images: [DEFAULT_OG_IMAGE],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
