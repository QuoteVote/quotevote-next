import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/AppShell/Wordmark";

export const metadata: Metadata = {
  title: "Page not found — Quote.Vote",
  robots: { index: false },
};

const HELP = [
  {
    href: "/",
    title: "Latest quotes",
    text: "See what people are discussing",
    tint: "qv-pub-tint-green",
    ink: "#0f7d56",
    icon: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    href: "/about",
    title: "About Quote.Vote",
    text: "Our mission and values",
    tint: "qv-pub-tint-blue",
    ink: "#2457e6",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8h.01M11 12h1v5h1" />
      </>
    ),
  },
  {
    href: "/auths/request-access",
    title: "Request an invite",
    text: "Join the conversation",
    tint: "qv-pub-tint-purple",
    ink: "#6d3fd1",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
  },
];

/** 404, from the approved design (States). */
export default function NotFound() {
  return (
    <div className="qv-auth qv-pub relative flex min-h-screen flex-col overflow-hidden bg-[var(--inv-ground)]!">
      <div
        aria-hidden="true"
        className="qv-pub-dots absolute top-[150px] left-20 hidden h-[100px] w-40 opacity-70 lg:block"
      />
      <div
        aria-hidden="true"
        className="qv-pub-dots absolute right-[90px] bottom-[120px] hidden h-[100px] w-40 opacity-70 lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute top-[90px] -right-20 size-[260px] rounded-full border-[24px] border-[#e9f0ff] [.dark_&]:border-[#13324a]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-[60px] -left-[90px] size-[240px] rounded-full border-[22px] border-[#e6f6ee] [.dark_&]:border-[#12382a]"
      />
      <header className="relative flex h-16 items-center border-b border-[var(--pub-line)] bg-[var(--auth-surface)] px-4 sm:px-6 lg:h-[76px] lg:px-12">
        <Wordmark className="text-[22px] lg:text-[26px]" />
        <Link href="/" className="qv-auth-btn ml-auto">
          Go to Home
        </Link>
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center gap-[22px] px-4 pt-10 pb-10 text-center">
        <div
          role="img"
          aria-label="404"
          className="font-wordmark flex items-center text-[110px] leading-none font-black tracking-[-0.02em] text-[var(--auth-ink)] sm:text-[160px] lg:text-[220px]"
        >
          4{/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
          <img
            src="/assets/redesign/globe-logo.svg"
            alt=""
            aria-hidden="true"
            className="mx-1.5 -mt-[0.13em] h-[0.91em] w-auto"
          />
          4
        </div>
        <h1 className="qv-auth-display m-0 text-[30px]! lg:text-[44px]!">
          We couldn’t find that page
        </h1>
        <p className="qv-auth-muted m-0 max-w-[520px] text-[17px] leading-[1.6]! font-medium">
          The link may be broken, or the page may have moved. Try searching, or head back to the
          latest quotes.
        </p>
        <form role="search" action="/" method="get" className="flex w-full max-w-[560px] gap-2.5">
          <label htmlFor="not-found-search" className="sr-only">
            Search quotes, people and topics
          </label>
          <div className="flex h-[52px] flex-1 items-center gap-2.5 rounded-[14px] border border-[var(--pub-line-2)] bg-[var(--auth-surface)] px-4 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.3)] focus-within:border-[var(--auth-focus-line)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-[var(--auth-muted)]"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="not-found-search"
              name="q"
              type="search"
              placeholder="Search quotes, people and topics"
              className="min-w-0 flex-1 border-0 bg-transparent text-base text-[var(--auth-ink)] outline-none placeholder:text-[var(--auth-muted)] sm:text-[15px]"
            />
          </div>
          <button type="submit" className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg">
            Search
          </button>
        </form>
        <div className="mt-3.5 grid w-full max-w-[780px] grid-cols-1 gap-3.5 text-left sm:grid-cols-3">
          {HELP.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="flex items-center gap-3.5 rounded-[16px] border border-[var(--pub-line)] bg-[var(--auth-surface)] p-[18px] text-[var(--auth-ink)] no-underline hover:border-[var(--auth-line-hover)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2"
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-[12px] ${h.tint}`}
                style={{ color: h.ink }}
                aria-hidden="true"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {h.icon}
                </svg>
              </span>
              <span className="leading-normal">
                <b className="text-[15px]">{h.title}</b>
                <br />
                <span className="qv-auth-hint font-semibold">{h.text}</span>
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
