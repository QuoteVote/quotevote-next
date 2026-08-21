"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { useMutation } from "@apollo/client/react";
import { REQUEST_USER_ACCESS_MUTATION } from "@/graphql/mutations";
import { Globe } from "@/components/Icons";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Three-column CTA: request invite, newsletter-style email, and donate.
 */
export function AboutCtaBand() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestUserAccess] = useMutation(REQUEST_USER_ACCESS_MUTATION);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestUserAccess({ variables: { requestUserAccessInput: { email: trimmed } } });
      setSuccessMessage("Thank you — we'll be in touch soon.");
      setEmail("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("Email already exists")) {
        setErrorMessage("This email is already registered.");
      } else {
        setErrorMessage("Failed to submit. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="overflow-hidden bg-emerald-50" aria-label="Join Quote.Vote">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 sm:py-16 md:grid-cols-3 lg:px-8">
        <div className="flex min-w-0 flex-col items-center text-center">
          <h2 className="text-xl font-extrabold leading-snug text-[#0A2342] sm:text-2xl">
            Join us in creating a truly open and equal community.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Quote.Vote is a nonprofit, open-source platform. Every contribution goes directly toward
            keeping the service free and supporting communities.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Globe size={40} className="size-10" />
            <Link
              href="/auths/request-access"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#22c55e] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-[#16a34a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2"
              aria-label="Request an invite to join Quote.Vote"
            >
              Request Invite
            </Link>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center text-center">
          <h2 className="text-2xl font-extrabold text-[#0A2342]">Please be in touch!</h2>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-5 w-full"
            aria-label="Be in touch email form"
          >
            <div className="flex min-w-0 flex-row gap-2">
              <label htmlFor="about-touch-email" className="sr-only">
                Email address
              </label>
              <input
                id="about-touch-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="your@email.com"
                required
                aria-invalid={!!errorMessage}
                aria-describedby={
                  [
                    "about-touch-privacy",
                    errorMessage ? "about-touch-error" : null,
                    successMessage ? "about-touch-success" : null,
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#16a34a]"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#22c55e] px-4 text-sm font-semibold text-white hover:bg-[#16a34a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] disabled:opacity-50"
              >
                {isSubmitting ? "Sending…" : "Subscribe"}
              </button>
            </div>
            <p id="about-touch-privacy" className="mt-3 text-sm text-slate-500">
              No spam, ever. Unsubscribe anytime.
            </p>
            {errorMessage ? (
              <p
                id="about-touch-error"
                className="mt-2 text-left text-sm text-rose-600"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p
                id="about-touch-success"
                className="mt-2 text-left text-sm text-[#16a34a]"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}
          </form>
        </div>

        <div className="flex min-w-0 flex-col items-center text-center">
          <Heart className="mb-3 size-8 fill-[#22c55e] text-[#22c55e]" aria-hidden />
          <h2 className="text-xl font-extrabold leading-snug text-[#0A2342] sm:text-2xl">
            Help keep Quote.Vote free for everyone
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Your donation supports development, moderation, and hosting.
          </p>
          <a
            href="https://opencollective.com/quotevote/donate"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-[#6d28d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 sm:w-auto"
            aria-label="Donate to Quote.Vote today (opens in new tab)"
          >
            Donate Today
          </a>
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#2563eb] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
          >
            Learn more about donations
            <ArrowRight size={16} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
