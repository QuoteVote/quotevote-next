"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import { REQUEST_USER_ACCESS_MUTATION } from "@/graphql/mutations";
import { parseRequestAccessEmail } from "@/lib/validation/requestAccessSchema";
import {
  INVITE_ALREADY_SENT_MESSAGE,
  isInviteAlreadySentError,
} from "@/lib/utils/inviteAlreadySent";
import type { NewsletterFormProps } from "@/types/access";

/**
 * "Please be in touch!" email form. There is no separate newsletter list yet, so, as
 * the About page did before, it records the address as an access request.
 */
export function NewsletterForm({ id, variant }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [sending, setSending] = useState(false);
  const [requestUserAccess] = useMutation(REQUEST_USER_ACCESS_MUTATION);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setDone("");
    const parsed = parseRequestAccessEmail(email);
    if (!parsed.success) {
      setError(parsed.message);
      return;
    }
    setSending(true);
    try {
      await requestUserAccess({ variables: { requestUserAccessInput: { email: parsed.email } } });
      setDone("Thank you — we'll be in touch soon.");
      setEmail("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("Email already exists")) setError("This email is already registered.");
      else if (isInviteAlreadySentError(err)) setError(INVITE_ALREADY_SENT_MESSAGE);
      else setError("Failed to submit. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const messageId = `${id}-message`;
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Be in touch email form"
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <label htmlFor={id} className="sr-only">
          Email address
        </label>
        <input
          id={id}
          type="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || done ? messageId : undefined}
          className="qv-auth-input h-11! min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={sending}
          className={variant === "desktop" ? "qv-auth-btn qv-auth-btn-blue" : "qv-auth-btn"}
        >
          Subscribe
        </button>
      </div>
      {(error || done) && (
        <p
          id={messageId}
          role={error ? "alert" : "status"}
          className={
            error ? "qv-auth-err m-0" : "m-0 text-[13px] font-semibold text-[var(--pub-green)]"
          }
        >
          {error || done}
        </p>
      )}
    </form>
  );
}
