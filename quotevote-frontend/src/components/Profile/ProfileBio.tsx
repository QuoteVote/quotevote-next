"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ProfileBioProps {
  bio?: string | null;
}

export function ProfileBio({ bio }: ProfileBioProps) {
  const normalizedBio = bio?.trim();
  if (!normalizedBio) return null;

  return <ProfileBioContent key={normalizedBio} bio={normalizedBio} />;
}

function ProfileBioContent({ bio }: { bio: string }) {
  const bioRef = useRef<HTMLParagraphElement>(null);
  const bioContentId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const element = bioRef.current;
    if (!element || isExpanded) return;

    const updateTruncation = () => {
      setIsTruncated(element.scrollHeight > element.clientHeight + 1);
    };

    updateTruncation();
    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateTruncation) : null;
    resizeObserver?.observe(element);
    window.addEventListener("resize", updateTruncation);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateTruncation);
    };
  }, [isExpanded]);

  return (
    <div data-testid="profile-bio" className="mt-2 max-w-2xl">
      <div className={cn(isExpanded && "rounded-lg border border-border bg-muted/30 p-3")}>
        <p
          ref={bioRef}
          id={bioContentId}
          className={cn(
            "profile-bio-text whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground",
            isExpanded && "profile-bio-text-expanded"
          )}
        >
          {bio}
        </p>
        {isTruncated && (
          <button
            type="button"
            className={cn(
              "mt-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !isExpanded && "sm:hidden"
            )}
            aria-controls={bioContentId}
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            {isExpanded ? "Less" : "More"}
          </button>
        )}
      </div>
    </div>
  );
}
