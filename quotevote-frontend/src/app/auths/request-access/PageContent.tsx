"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApolloClient, useMutation } from "@apollo/client/react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { REQUEST_USER_ACCESS_MUTATION } from "@/graphql/mutations";
import { GET_CHECK_DUPLICATE_EMAIL } from "@/graphql/queries";
import { RequestAccessSuccess } from "@/components/RequestAccess/RequestAccessSuccess";
import { RequestAccessFeatures } from "@/components/RequestAccess/RequestAccessFeatures";
import { Wordmark } from "@/components/AppShell/Wordmark";
import { parseRequestAccessEmail } from "@/lib/validation/requestAccessSchema";
import {
  INVITE_ALREADY_SENT_MESSAGE,
  isInviteAlreadySentError,
} from "@/lib/utils/inviteAlreadySent";

const DONATE_URL = "https://opencollective.com/quotevote/donate";

export function RequestAccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasRedirected = !!searchParams.get("from");
  const client = useApolloClient();
  const [requestAccess, { loading }] = useMutation(REQUEST_USER_ACCESS_MUTATION);

  const [userDetails, setUserDetails] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState<string | null>(null);

  const onSubmit = async () => {
    if (loading) return;
    setErrorMessage("");
    setIsExistingAccount(false);

    const parsed = parseRequestAccessEmail(userDetails);
    if (!parsed.success) {
      setErrorMessage(parsed.message);
      return;
    }
    const { email } = parsed;

    try {
      const { data } = await client.query({
        query: GET_CHECK_DUPLICATE_EMAIL,
        variables: { email },
        fetchPolicy: "network-only",
      });
      const hasDuplicate =
        ((data as { checkDuplicateEmail?: unknown[] })?.checkDuplicateEmail?.length ?? 0) > 0;
      if (hasDuplicate) {
        setErrorMessage("This email already exists.");
        setIsExistingAccount(true);
        return;
      }
      await requestAccess({ variables: { requestUserAccessInput: { email } } });
      setRequestedEmail(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("email: Path `email` is required.")) {
        setErrorMessage("Email is required");
      } else if (isInviteAlreadySentError(err)) {
        setErrorMessage(INVITE_ALREADY_SENT_MESSAGE);
      } else {
        setErrorMessage("We couldn’t send your request. Please try again in a moment.");
      }
    }
  };

  return (
    <div className="qv-auth min-h-screen bg-[var(--auth-surface)] pb-14" id="top">
      <header className="flex h-16 items-center border-b border-[var(--ra-header-line)] px-4 sm:px-8 lg:h-[76px] lg:px-12">
        <Wordmark className="text-[22px] lg:text-[26px]" />
        <nav aria-label="Account" className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="qv-auth-btn qv-auth-btn-ghost"
          >
            Go back
          </button>
          <Link href="/auths/login" className="qv-auth-btn">
            Log in
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto flex max-w-[1240px] flex-col items-center gap-10 px-4 pt-10 pb-10 sm:px-8 lg:flex-row lg:gap-14 lg:px-0 lg:pt-14">
          <div className="flex w-full flex-1 flex-col gap-[22px]">
            <span id="request-access-badge" className="qv-auth-label-yellow">
              Invite-only while we grow
            </span>
            <h1 className="qv-auth-display text-[40px]! sm:text-[52px]! lg:text-[62px]!">
              <span className="block">Everyone’s voice.</span>
              <span className="qv-auth-grad block">One shared plan.</span>
            </h1>
            <p
              id="request-access-intro"
              className="m-0 max-w-[500px] text-base leading-[1.6]! text-[var(--ra-body)] lg:text-lg"
            >
              Request an invite and an admin will review it. When it’s approved, we’ll email you a
              link to create your account.
            </p>

            {wasRedirected && !requestedEmail && (
              <p className="m-0 max-w-[540px] text-[14.5px] font-semibold text-[var(--auth-ink-2)]">
                You need an account to contribute. Viewing is public, but posting, voting and
                quoting need an invite.
              </p>
            )}

            {requestedEmail ? (
              <RequestAccessSuccess email={requestedEmail} />
            ) : (
              <form
                data-testid="invite-request-form"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void onSubmit();
                }}
                className="flex max-w-[540px] flex-col gap-2.5"
              >
                <label htmlFor="invite-email" className="qv-auth-label">
                  Email address
                </label>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    id="invite-email"
                    data-testid="invite-email-input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@example.org"
                    value={userDetails}
                    onChange={(e) => setUserDetails(e.target.value)}
                    aria-invalid={errorMessage ? true : undefined}
                    aria-describedby={
                      errorMessage
                        ? "invite-email-error"
                        : "request-access-badge request-access-intro"
                    }
                    className="qv-auth-input h-[52px]! flex-1"
                  />
                  <button
                    data-testid="invite-submit-button"
                    type="submit"
                    disabled={loading}
                    aria-busy={loading || undefined}
                    className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg"
                  >
                    {loading ? "Sending…" : "Request Invite"}
                  </button>
                </div>
                {errorMessage && (
                  <p
                    id="invite-email-error"
                    role="alert"
                    data-testid="invite-duplicate-message"
                    className="qv-auth-err leading-normal! font-semibold!"
                  >
                    {errorMessage}
                    {isExistingAccount && (
                      <>
                        {" "}
                        You can{" "}
                        <Link href="/auths/login" className="font-extrabold underline">
                          sign in
                        </Link>{" "}
                        or{" "}
                        <Link href="/auths/forgot-password" className="font-extrabold underline">
                          reset your password
                        </Link>
                        .
                      </>
                    )}
                  </p>
                )}
              </form>
            )}
          </div>
          <div
            className="qv-auth-art aspect-[6/5] w-full shrink-0 bg-cover bg-center lg:h-[500px] lg:w-[600px]"
            style={{ backgroundImage: "url('/assets/redesign/request-access-team.jpg')" }}
            role="img"
            aria-label="A team planning together around a shared board"
          />
        </section>

        <RequestAccessFeatures />

        <section
          className="mx-auto mt-10 max-w-[1240px] px-4 sm:px-8 lg:px-0"
          aria-labelledby="donate-title"
        >
          <div className="qv-auth-donate flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-7 sm:p-8">
            <div className="flex flex-1 flex-col gap-2.5">
              <h2 id="donate-title" className="qv-auth-display m-0 text-[30px]!">
                Please Donate
              </h2>
              <p className="m-0 text-[15px] leading-[1.6]! text-[var(--ra-body)]">
                Quote.Vote is non-profit and open source. Our only funding comes from people like
                you.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="qv-auth-btn qv-auth-btn-blue qv-auth-btn-lg"
                aria-label="Donate Today (opens in a new tab)"
              >
                Donate Today
              </a>
              <Link href="/about" className="qv-auth-link text-[13.5px] font-bold">
                Read Our Mission →
              </Link>
            </div>
          </div>
        </section>

        <p className="mt-9 mb-0 text-center">
          <a
            href="#top"
            className="qv-auth-link inline-flex items-center gap-1 text-sm font-extrabold"
          >
            <ArrowUp className="size-3.5" aria-hidden="true" />
            Back to top
          </a>
        </p>
      </main>
    </div>
  );
}
