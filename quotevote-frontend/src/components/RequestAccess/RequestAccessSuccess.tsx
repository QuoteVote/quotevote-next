"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { RequestAccessSuccessProps } from "@/types/components";

/**
 * Shown in place of the form after an invite request goes through. Accounts are
 * invite-only, so it says what happens next instead of implying the visitor has joined.
 */
export function RequestAccessSuccess({ email }: RequestAccessSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The form is gone, so move focus here for keyboard and screen reader users.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="request-access-success-title"
      data-testid="request-access-success"
      className="qv-lit qv-auth-received flex max-w-[540px] flex-col gap-2.5 p-[26px]"
      data-light="up"
    >
      <h2
        ref={headingRef}
        id="request-access-success-title"
        data-testid="invite-success-message"
        tabIndex={-1}
        className="qv-auth-display m-0 text-[28px]! focus:outline-none"
      >
        Request received
      </h2>
      <b className="text-sm">What happens next</b>
      <p className="qv-auth-muted m-0 text-sm leading-[1.6]!">
        An admin reviews your request
        {email ? (
          <>
            {" "}
            for{" "}
            <span className="font-semibold text-[var(--auth-ink)] [overflow-wrap:anywhere]">
              {email}
            </span>
          </>
        ) : null}
        . When it’s approved you’ll get an email with a link to set your password and create your
        account. If it doesn’t arrive, check your spam folder.
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        <Link href="/" className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-sm">
          Explore Quote.Vote
        </Link>
        <Link href="/auths/login" className="qv-auth-btn qv-auth-btn-sm">
          Go to sign in
        </Link>
      </div>
    </section>
  );
}
