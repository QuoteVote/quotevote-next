import Link from "next/link";
import { Mail } from "lucide-react";
import { Wordmark } from "@/components/AppShell/Wordmark";
import type { PublicFooterProps } from "@/types/access";

const DONATE_URL = "https://opencollective.com/quotevote/donate";
const GITHUB_URL = "https://github.com/QuoteVote/quotevote-next";

/** The dark footer of the public pages: call to action, links, support and legal. */
export function PublicFooter({ exploreHref = "/#feed" }: PublicFooterProps) {
  return (
    <footer
      aria-label="Site footer"
      className="qv-pub-foot relative mt-auto overflow-hidden pt-14 pb-7"
    >
      <div
        aria-hidden="true"
        className="qv-pub-dots absolute top-9 right-12 hidden h-[84px] w-[140px] opacity-[0.18] lg:block"
      />
      <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-6 border-b border-[#1f2a40] px-4 pb-10 sm:px-8 lg:flex-row lg:items-center lg:gap-8 lg:px-0">
        <div className="flex flex-col gap-1.5">
          <b className="qv-auth-display text-[26px] text-white">Ready for better conversations?</b>
          <span className="text-[15px] font-semibold text-[#b9c3d4]">
            Request an invite, or read along first. Public quotes are open to everyone.
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/auths/request-access"
            className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg text-white!"
          >
            Request Invite
          </Link>
          <a
            href={exploreHref}
            className="qv-auth-btn qv-auth-btn-lg border-[#34425c]! bg-transparent! text-white! shadow-none!"
          >
            Explore Discussions
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-10 px-4 pt-10 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr] lg:px-0">
        <div className="col-span-2 flex flex-col gap-3.5 md:col-span-1">
          <Wordmark className="text-[26px] text-white" />
          <span className="text-sm leading-[1.6] text-[#b9c3d4]">
            A neutral public square for text-based dialogue. Nonprofit, open source and powered by
            people.
          </span>
          <div className="mt-1 flex gap-2">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Quote.Vote on GitHub"
              className="qv-pub-foot-icon"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.7-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
              </svg>
            </a>
            <a
              href="mailto:admin@quote.vote"
              aria-label="Email Quote.Vote"
              className="qv-pub-foot-icon"
            >
              <Mail size={19} aria-hidden="true" />
            </a>
          </div>
        </div>
        <nav aria-label="Platform" className="flex flex-col gap-[11px]">
          <b className="qv-pub-foot-head">Platform</b>
          <a href={exploreHref}>Explore</a>
          <Link href="/#how">How it Works</Link>
          <Link href="/#communities">Communities</Link>
          <Link href="/auths/login">Log in</Link>
        </nav>
        <nav aria-label="About" className="flex flex-col gap-[11px]">
          <b className="qv-pub-foot-head">About</b>
          <Link href="/about">Our Mission</Link>
          <a href={DONATE_URL} target="_blank" rel="noopener noreferrer">
            Donate
          </a>
        </nav>
        <nav aria-label="Resources" className="flex flex-col gap-[11px]">
          <b className="qv-pub-foot-head">Resources</b>
          <Link href="/contributing">Contributing</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <Link href="/code-of-conduct">Code of Conduct</Link>
        </nav>
        <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
          <b className="qv-pub-foot-head">Support us</b>
          <span className="text-[13.5px] leading-[1.55] text-[#b9c3d4]">
            No ads and nothing for sale. Donations keep Quote.Vote free for everyone.
          </span>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="qv-auth-btn qv-auth-btn-sm qv-auth-btn-blue w-fit text-white!"
          >
            Donate Today
          </a>
        </div>
      </div>

      <div className="mx-auto mt-11 flex max-w-[1240px] flex-col items-start justify-between gap-3 border-t border-[#1f2a40] px-4 pt-5 text-[13px] text-[#8592a8] sm:px-8 md:flex-row md:items-center lg:px-0">
        <span>© {new Date().getFullYear()} Quote.Vote · Open source and non-profit</span>
        <nav aria-label="Legal" className="flex gap-[22px]">
          <Link href="/terms" className="text-[13px]!">
            Terms of Service
          </Link>
          <Link href="/code-of-conduct" className="text-[13px]!">
            Code of Conduct
          </Link>
        </nav>
        <span>Speak freely. Listen openly. Decide together.</span>
      </div>
    </footer>
  );
}
