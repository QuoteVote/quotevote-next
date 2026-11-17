"use client";

import { useState, useSyncExternalStore } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApolloClient, useMutation } from "@apollo/client/react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { REQUEST_USER_ACCESS_MUTATION } from "@/graphql/mutations";
import { GET_CHECK_DUPLICATE_EMAIL } from "@/graphql/queries";
import { RequestAccessSuccess } from "@/components/RequestAccess/RequestAccessSuccess";
import { Globe } from "@/components/Icons";
import { parseRequestAccessEmail } from "@/lib/validation/requestAccessSchema";
import {
  INVITE_ALREADY_SENT_MESSAGE,
  isInviteAlreadySentError,
} from "@/lib/utils/inviteAlreadySent";
import { PRIMARY_ACTION_CLASS } from "@/lib/constants/formControls";
import { cn } from "@/lib/utils";

const BG_IMAGES = [
  "viviana-rishe-UC8fvOyG5pU-unsplash.jpg",
  "steph-smith-3jYcQf9oiJ8-unsplash.jpg",
  "sergio-rodriguez-rrlEOXRmMAA-unsplash.jpg",
  "sergio-otoya-gCNh426vB30-unsplash.jpg",
  "rondell-chaz-mabunga-EHLKkMDxe3M-unsplash.jpg",
  "rommel-paras-wrHnE3kMplg-unsplash.jpg",
  "peter-thomas-efLcMHXtrg0-unsplash.jpg",
  "julia-caesar-jeXkw2HR1SU-unsplash.jpg",
  "ehmir-bautista-JjDqyWuWZyU-unsplash.jpg",
  "adam-navarro-qXcl3z7_AOc-unsplash.jpg",
  "actionvance-guy5aS3GvgA-unsplash.jpg",
];

// One random background per page load, picked in the browser only. Picking it during
// render gave the server and the browser different images (a hydration mismatch).
let pickedBackground: string | null = null;
const subscribeToBackground = () => () => {};
const getBackground = () =>
  (pickedBackground ??= BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)]);
const getServerBackground = () => null;

// Controls sit on a photo, so they get their own dark backing and a white focus ring.
const ON_PHOTO_FOCUS_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/60";
const HEADER_LINK_CLASS = cn(
  "inline-flex min-h-9 items-center rounded-full bg-black/60 px-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/75",
  ON_PHOTO_FOCUS_CLASS
);
const PHOTO_BUTTON_CLASS = cn(
  "inline-flex min-h-11 items-center justify-center rounded-md px-6 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-80",
  PRIMARY_ACTION_CLASS,
  ON_PHOTO_FOCUS_CLASS
);

export function RequestAccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasRedirected = !!searchParams.get("from");

  const client = useApolloClient();
  const [requestAccess, { loading }] = useMutation(REQUEST_USER_ACCESS_MUTATION);

  const bgImage = useSyncExternalStore(subscribeToBackground, getBackground, getServerBackground);
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

      await requestAccess({
        variables: { requestUserAccessInput: { email } },
      });
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
    <div
      className="flex min-h-screen w-full flex-col items-center bg-[#1f2a24] bg-cover bg-left bg-no-repeat pb-10 text-white"
      style={bgImage ? { backgroundImage: `url('/assets/bg/${bgImage}')` } : undefined}
    >
      {/* Header: logo (left) | Go back + Log in (right) */}
      <header className="flex h-16 w-full shrink-0 items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Quote.Vote home"
          className={cn("flex items-center rounded-full", ON_PHOTO_FOCUS_CLASS)}
        >
          <Globe size={32} />
        </Link>

        <nav aria-label="Account" className="flex items-center gap-2">
          <button type="button" onClick={() => router.back()} className={HEADER_LINK_CLASS}>
            Go back
          </button>
          <Link href="/auths/login" className={HEADER_LINK_CLASS}>
            Log in
          </Link>
        </nav>
      </header>

      {requestedEmail ? (
        <main className="flex w-full flex-1 items-start justify-center px-4 pt-6 sm:pt-12">
          <RequestAccessSuccess email={requestedEmail} />
        </main>
      ) : (
        <main className="flex w-full flex-col items-center px-4">
          {/* QUOTE.VOTE title in body, centered above the form */}
          <h1 className="mb-6 text-center">
            <span
              className="font-bold uppercase tracking-[0.12em] text-white"
              style={{
                fontSize: "clamp(2rem, 6vw, 3.5rem)",
                fontFamily: "Montserrat, Inter, sans-serif",
                WebkitTextStroke: "1.5px black",
                paintOrder: "stroke fill",
              }}
            >
              Quote.Vote
            </span>
            <span className="sr-only"> request an invite</span>
          </h1>

          {/* Redirect notice */}
          {wasRedirected && (
            <p className="mb-4 w-full max-w-xl rounded-lg bg-black/65 p-4 text-center text-white backdrop-blur-sm">
              You need an account to contribute. Viewing is public, but posting, voting, and quoting
              require an invite.
            </p>
          )}

          {/* Email + button */}
          <form
            data-testid="invite-request-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void onSubmit();
            }}
            className="w-full max-w-xl rounded-xl bg-black/65 p-4 backdrop-blur-sm sm:p-5"
          >
            <label htmlFor="invite-email" className="mb-2 block text-sm font-medium text-white">
              Email address
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="invite-email"
                data-testid="invite-email-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                value={userDetails}
                onChange={(e) => setUserDetails(e.target.value)}
                aria-invalid={errorMessage ? true : undefined}
                aria-describedby={errorMessage ? "invite-email-error" : "invite-email-hint"}
                className="min-h-11 w-full flex-1 rounded-md border border-[#8a8a93] bg-white px-4 text-base text-[#18181b] placeholder:text-[#6b6b73] focus-visible:border-[#2f7a4c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white aria-invalid:border-[#c62828]"
              />
              <button
                data-testid="invite-submit-button"
                type="submit"
                disabled={loading}
                aria-busy={loading || undefined}
                className={PHOTO_BUTTON_CLASS}
              >
                {loading ? "Sending…" : "Request Invite"}
              </button>
            </div>
            {errorMessage ? (
              <p
                id="invite-email-error"
                role="alert"
                data-testid="invite-duplicate-message"
                className="mt-3 flex items-start gap-2 rounded-md bg-[#fdecea] px-3 py-2 text-sm font-medium text-[#8c1d18]"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {errorMessage}
                  {isExistingAccount && (
                    <>
                      {" "}
                      If it&apos;s yours,{" "}
                      <Link href="/auths/login" className="underline underline-offset-2">
                        sign in
                      </Link>{" "}
                      or{" "}
                      <Link href="/auths/forgot-password" className="underline underline-offset-2">
                        reset your password
                      </Link>
                      .
                    </>
                  )}
                </span>
              </p>
            ) : (
              <p id="invite-email-hint" className="mt-2 text-xs text-white">
                Quote.Vote is invite-only. We&apos;ll email you when your request is approved.
              </p>
            )}
          </form>

          {/* Two-column info overlay */}
          <div className="mt-10 grid w-full max-w-4xl gap-6 rounded-lg bg-black/60 p-6 backdrop-blur-sm sm:p-8 md:grid-cols-2">
            <div>
              <h2 className="mb-3 text-center text-xl! font-semibold text-white">
                No Ads, No Algorithms
              </h2>
              <p className="mb-2 text-sm leading-relaxed">
                There is no ranking, boosting, or personalization engine. You can&apos;t pay to be
                seen. Users seek to find quotes.
              </p>
              <p className="text-sm leading-relaxed">
                Discovery is deliberate. Feeds are chronological. An experience of hunting and
                discovery, not passive scrolling.
              </p>
            </div>
            <div>
              <h2 className="mb-3 text-center text-xl! font-semibold text-white">
                Open Source, Non Profit
              </h2>
              <p className="mb-2 text-sm leading-relaxed">
                The platform is non-profit, open source, and donation-supported. You can&apos;t pay
                to be seen.
              </p>
              <p className="text-sm leading-relaxed">
                The only economic model is when users like what they experience, and give money via
                donations.
              </p>
            </div>
          </div>

          {/* Read Our Mission */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = "mission";
              document.getElementById("mission")?.scrollIntoView({ behavior: "smooth" });
            }}
            className={cn(PHOTO_BUTTON_CLASS, "mt-8 w-52")}
          >
            Read Our Mission
          </button>
        </main>
      )}
    </div>
  );
}
