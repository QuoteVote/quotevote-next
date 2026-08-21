import Link from "next/link";
import { Github } from "lucide-react";
import { Globe } from "@/components/Icons";

/**
 * Compact Zeplin header for the public About page: logo, GitHub, Request Invite.
 */
export function AboutHeader() {
  return (
    <header
      className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-hidden border-b border-border/60 bg-white/95 backdrop-blur-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
          aria-label="Quote.Vote home"
        >
          <Globe size={28} className="size-7" />
          <span
            className="hidden select-none text-lg font-extrabold tracking-wide sm:block"
            style={{ color: "#0A2342" }}
          >
            QUOTE.VOTE
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <a
            href="https://github.com/QuoteVote/quotevote-next"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-11 items-center justify-center rounded-lg text-[#0A2342] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]"
            aria-label="GitHub repository (opens in new tab)"
          >
            <Github size={22} />
          </a>
          <Link
            href="/auths/request-access"
            className="inline-flex min-h-11 items-center rounded-lg bg-[#22c55e] px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(34,197,94,0.28)] transition-opacity hover:bg-[#16a34a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 sm:px-5"
            aria-label="Request an invite to join Quote.Vote"
          >
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Request Invite</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
