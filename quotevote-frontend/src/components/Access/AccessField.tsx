"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccessFieldProps } from "@/types/access";

/** A labelled input of the access pages, with an optional link, error, hint and show/hide button. */
export function AccessField({
  id,
  label,
  labelLink,
  error,
  hint,
  revealable = false,
  locked = false,
  type = "text",
  className,
  ...inputProps
}: AccessFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");
  const hasButton = revealable || locked;

  return (
    <div className="qv-auth-field">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="qv-auth-label">
          {label}
        </label>
        {labelLink && (
          <Link href={labelLink.href} className="qv-auth-link text-[13px] font-bold lg:text-[13.5px]">
            {labelLink.label}
          </Link>
        )}
      </div>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          type={revealable && revealed ? "text" : type}
          readOnly={locked || inputProps.readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          data-with-button={hasButton || undefined}
          className={cn("qv-auth-input", className)}
        />
        {revealable && (
          <button
            type="button"
            className="qv-auth-icon-btn"
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            aria-controls={id}
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
        {locked && (
          <Lock
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 text-[var(--auth-muted)]"
          />
        )}
      </div>
      {hint && (
        <span id={hintId} className="qv-auth-hint">
          {hint}
        </span>
      )}
      {error && (
        <p id={errorId} role="alert" className="qv-auth-err">
          {error}
        </p>
      )}
    </div>
  );
}
