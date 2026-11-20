"use client";

import type { FC } from "react";
import Link from "next/link";

import { useAppStore } from "@/store";
import { toAbsolutePostUrl } from "@/lib/utils/sanitizeUrl";
import type { ChatParticipant } from "@/types/chat";

interface QuotePostDetails {
  _id?: string;
  title?: string | null;
  text?: string | null;
  userId?: string | null;
  url?: string | null;
}

interface QuoteHeaderMessageProps {
  postDetails: QuotePostDetails | null | undefined;
  postCreator: ChatParticipant | null | undefined;
}

/** The Original Quote card at the top of a post's discussion (design). */
const QuoteHeaderMessage: FC<QuoteHeaderMessageProps> = ({ postDetails }) => {
  const setChatOpen = useAppStore((state) => state.setChatOpen);

  if (!postDetails) return null;

  const { title, text, url } = postDetails;
  // Same-app path only ('' origin); without one the card simply has no link.
  const postPath = toAbsolutePostUrl(url, "");

  return (
    <div className="qv-original">
      <span className="qv-original-eyebrow">Original quote</span>
      {text ? (
        <p className="qv-original-text">&ldquo;{text}&rdquo;</p>
      ) : (
        title && <p className="qv-original-text">{title}</p>
      )}
      {postPath && (
        <Link
          href={postPath}
          onClick={() => setChatOpen(false)}
          data-testid="quote-header-view-post"
          className="qv-original-link"
        >
          View post →
        </Link>
      )}
    </div>
  );
};

export default QuoteHeaderMessage;
