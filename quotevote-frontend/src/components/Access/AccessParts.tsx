import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  AccessConsentProps,
  AccessFootnoteProps,
  AccessFormHeaderProps,
} from "@/types/access";

const CONSENT_DOCS = {
  terms: { label: "Terms of Service", href: "/terms" },
  conduct: { label: "Code of Conduct", href: "/code-of-conduct" },
} as const;

/** "I agree to the Terms of Service" / "Code of Conduct" checkbox, with its link. */
export function AccessConsent({ id, document, error, className, ...inputProps }: AccessConsentProps) {
  const doc = CONSENT_DOCS[document];
  const errorId = `${id}-error`;
  return (
    <div>
      <div className={cn("qv-auth-check", className)}>
        <input
          {...inputProps}
          id={id}
          type="checkbox"
          aria-label={`I agree to the ${doc.label}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <label htmlFor={id} className="cursor-pointer">
          I agree to the
        </label>
        <Link href={doc.href} target="_blank" rel="noopener noreferrer">
          {doc.label}
        </Link>
      </div>
      {error && (
        <p id={errorId} role="alert" className="qv-auth-err">
          {error}
        </p>
      )}
    </div>
  );
}

/** Title block of an access form. */
export function AccessFormHeader({ title, subtitle, eyebrow, subtitleDesktopOnly }: AccessFormHeaderProps) {
  return (
    <div>
      {eyebrow && <p className="qv-auth-eyebrow">{eyebrow}</p>}
      <h1 className="qv-auth-display text-[28px]! lg:text-[42px]!">{title}</h1>
      {subtitle && (
        <p
          className={cn(
            "qv-auth-muted mt-2 mb-0 leading-[1.55]! font-semibold",
            subtitleDesktopOnly && "hidden lg:block"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** The line under a form, e.g. "No account? Request an invite". */
export function AccessFootnote({ text, link }: AccessFootnoteProps) {
  return (
    <p className="qv-auth-muted m-0 text-center text-sm leading-normal! font-semibold">
      {text}{" "}
      <Link href={link.href} className="qv-auth-link font-extrabold">
        {link.label}
      </Link>
    </p>
  );
}
