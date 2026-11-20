"use client";

import { DisplayAvatar } from "@/components/DisplayAvatar";
import { sanitizeUrl } from "@/lib/utils/sanitizeUrl";
import type { SubmitPostPreviewProps } from "@/types/components";

/** How many characters of the post the preview shows before it trails off. */
const PREVIEW_TEXT_LENGTH = 120;

/** `citycouncil.gov/minutes` from `https://www.citycouncil.gov/minutes/` (host and path). */
export function previewLinkLabel(url: string): string | null {
  const safe = sanitizeUrl(url);
  if (!safe) return null;
  try {
    const { hostname, pathname } = new URL(safe);
    const path = pathname.replace(/\/+$/, "");
    return `${hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return null;
  }
}

/** The start of the post, cut at a word and ending in an ellipsis when it's longer. */
export function previewExcerpt(text: string, max = PREVIEW_TEXT_LENGTH): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const atWord = cut.slice(0, Math.max(cut.lastIndexOf(" "), 1));
  return `${atWord.replace(/[\s.,;:!?]+$/, "")}…`;
}

/**
 * Create quote preview (desktop): the post as it will appear in the feed, and what
 * readers can do with it, as in the design's right-hand column.
 */
export function SubmitPostPreview({
  title,
  text,
  tagTitle,
  citationUrl,
  attribution,
  username,
  avatar,
}: SubmitPostPreviewProps) {
  const link = citationUrl ? previewLinkLabel(citationUrl) : null;
  const href = link && citationUrl ? sanitizeUrl(citationUrl) : null;
  const who = attribution?.trim();

  return (
    <aside className="qv-compose-preview" aria-label="Preview" data-testid="post-preview">
      <span className="qv-compose-eyebrow">Preview</span>
      <article className="qv-postcard qv-compose-card">
        {tagTitle && (
          <div className="flex gap-1.5">
            <span className="qv-compose-chip"># {tagTitle}</span>
          </div>
        )}
        <h3 className="qv-compose-card-title" data-empty={!title.trim() || undefined}>
          {title.trim() || "Your title"}
        </h3>
        {(who || link) && (
          <p className="qv-compose-card-source">
            {who && <>— {who}</>}
            {who && link && " · "}
            {link && href && (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow">
                {link} ↗
              </a>
            )}
          </p>
        )}
        <p className="qv-compose-card-text" data-empty={!text.trim() || undefined}>
          {text.trim() ? previewExcerpt(text) : "The quote you add shows here."}
        </p>
        <div className="qv-compose-card-foot">
          <DisplayAvatar avatar={avatar} username={username} size={24} />
          <b>{username}</b>
          <span className="qv-compose-muted">· Just now</span>
        </div>
      </article>
      <div className="qv-compose-panel">
        <b>After you post</b>
        <span className="qv-compose-after">
          <span className="qv-compose-dot" data-light="up" aria-hidden="true" />
          Readers select words to agree or disagree.
        </span>
        <span className="qv-compose-after">
          <span className="qv-compose-dot" data-light="quote" aria-hidden="true" />
          They can quote the lines that matter.
        </span>
        <span className="qv-compose-after">
          <span className="qv-compose-dot" data-light="comment" aria-hidden="true" />
          Comments gather in the Discussion beside it.
        </span>
      </div>
    </aside>
  );
}
