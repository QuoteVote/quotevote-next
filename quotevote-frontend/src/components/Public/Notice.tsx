"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/AppShell/Wordmark";
import type {
  NoticeActionButtonProps,
  NoticeCardProps,
  NoticeDefinition,
  NoticeKind,
} from "@/types/access";

/* The notices from the approved design (Notices): one message, centred on a plain
   page with the header. Icons, colours and copy are the design's. */

const LINK_OFF =
  "M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 0 1 5.6 5.6l-1.4 1.4M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 0 1-5.6-5.6l1.4-1.4M4 4l16 16";
const CLOCK = (
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
);

const TONES = {
  yellow: { bg: "var(--pub-tint-yellow)", ink: "#875a0e" },
  blue: { bg: "var(--pub-tint-blue)", ink: "#2457e6" },
  red: { bg: "#fdecec", ink: "#c42b2b" },
  green: { bg: "var(--pub-tint-green)", ink: "#0f7d56" },
  purple: { bg: "var(--pub-tint-purple)", ink: "#6d3fd1" },
} as const;

const NOTICES: Record<NoticeKind, NoticeDefinition> = {
  invalidLink: {
    title: "Invalid or Expired Link",
    message: "This link doesn’t work anymore. Ask for a new one.",
    tone: "yellow",
    icon: <path d={LINK_OFF} />,
    actions: [
      { label: "Request New Invite", href: "/auths/request-access", primary: true },
      { label: "Go to Home", href: "/" },
    ],
  },
  invalidInvite: {
    title: "Invalid Invite",
    message: "This invite has expired or was already used.",
    tone: "yellow",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6M4 4l16 16" />
      </>
    ),
    actions: [{ label: "Request a new invite", href: "/auths/request-access", primary: true }],
  },
  sessionExpired: {
    title: "Your session has expired",
    message: "Please sign in again to continue.",
    tone: "blue",
    icon: CLOCK,
    actions: [{ label: "Sign In", href: "/auths/login", primary: true }],
  },
  error: {
    title: "Something went wrong",
    message: "We hit an error loading this page. Please try again.",
    tone: "red",
    icon: (
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    ),
    actions: [{ label: "Go to Home", href: "/" }],
  },
  postDeleted: {
    title: "This post has been deleted.",
    message: "It’s no longer on Quote.Vote.",
    tone: "blue",
    icon: (
      <>
        <path d="M5 4h10l4 4v12H5z" />
        <path d="M9 13h6" />
      </>
    ),
    actions: [
      { label: "Back to notifications", href: "/notifications" },
      { label: "Go to home", href: "/", primary: true },
    ],
  },
  signingOut: {
    title: "Signing you out…",
    message: "You’ll be back on the home page in a moment.",
    tone: "green",
    icon: <path d="M21 12a9 9 0 1 1-6.2-8.6" />,
    actions: [],
  },
  inTouch: {
    title: "We Will Be in Touch!",
    message: "Thanks for your interest in supporting Quote.Vote.",
    tone: "green",
    icon: <path d="m5 12 5 5 9-10" />,
    strokeWidth: 2.2,
    actions: [{ label: "Back to Home", href: "/" }],
  },
  noPosts: {
    title: "No posts found",
    message: "Nothing matches your search and filters.",
    tone: "purple",
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5M8 11h6" />
      </>
    ),
    actions: [],
  },
  emailSent: {
    title: "Email Sent",
    message: "Check your inbox for a link to reset your password.",
    tone: "green",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    actions: [{ label: "Go to Login", href: "/auths/login" }],
  },
  linkExpired: {
    title: "Link Expired",
    message: "Reset links work for a limited time. Ask for a fresh one.",
    tone: "yellow",
    icon: CLOCK,
    actions: [{ label: "Request a new link", href: "/auths/forgot-password", primary: true }],
  },
  linkIncomplete: {
    title: "Invalid Link",
    message: "This link isn’t complete. Open it again from your email, or ask for a new one.",
    tone: "red",
    icon: <path d={LINK_OFF} />,
    actions: [{ label: "Request a new link", href: "/auths/forgot-password" }],
  },
};

function ActionButton({ action }: NoticeActionButtonProps) {
  const className = `qv-auth-btn qv-auth-btn-sm${action.primary ? " qv-auth-btn-primary" : ""}`;
  if (action.onClick) {
    return (
      <button type="button" className={className} onClick={action.onClick}>
        {action.label}
      </button>
    );
  }
  return (
    <Link href={action.href ?? "/"} className={className}>
      {action.label}
    </Link>
  );
}

/** One notice card: icon, title, message and its buttons. */
export function NoticeCard({ kind, message, actions }: NoticeCardProps) {
  const notice = NOTICES[kind];
  const tone = TONES[notice.tone];
  const buttons = actions ?? notice.actions;
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The notice replaces what was there, so move focus to it.
  useEffect(() => {
    headingRef.current?.focus();
  }, [kind]);
  return (
    <section
      role="status"
      aria-labelledby={`notice-${kind}`}
      className="flex w-full flex-col items-start gap-3 rounded-[22px] border border-[var(--pub-line)] bg-[var(--auth-surface)] p-7 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.2)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:shadow-[var(--pub-panel-shadow)]"
    >
      <span
        className="flex size-14 items-center justify-center rounded-[18px] [.neo-brutalism_&]:rounded-[4px]"
        style={{ background: tone.bg, color: tone.ink }}
        aria-hidden="true"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={notice.strokeWidth ?? 2}
        >
          {notice.icon}
        </svg>
      </span>
      <h1
        id={`notice-${kind}`}
        ref={headingRef}
        tabIndex={-1}
        className="m-0 text-[22px]! leading-tight! font-extrabold tracking-[-0.02em]! focus:outline-none"
      >
        {notice.title}
      </h1>
      <p className="qv-auth-muted m-0 text-[14.5px] leading-[1.55]! font-medium">
        {message ?? notice.message}
      </p>
      {buttons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {buttons.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
        </div>
      )}
    </section>
  );
}

/** A notice on its own page: the header, then the card in the middle. */
export function NoticePage(props: NoticeCardProps) {
  return (
    <div className="qv-auth qv-pub flex min-h-screen flex-col bg-[var(--inv-ground)]!">
      <header className="flex h-16 items-center border-b border-[var(--pub-header-line)] bg-[var(--auth-surface)] px-4 sm:px-6 lg:h-[76px] lg:px-12">
        <Wordmark className="text-[22px] lg:text-[26px]" />
        <Link href="/" className="qv-auth-btn ml-auto">
          Go to Home
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <NoticeCard {...props} />
        </div>
      </main>
    </div>
  );
}
