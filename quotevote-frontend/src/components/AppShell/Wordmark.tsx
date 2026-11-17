import Link from "next/link";
import { Globe } from "@/components/Icons";
import { cn } from "@/lib/utils";
import type { WordmarkProps } from "@/types/appShell";

/** QUOTE.VOTE with the globe as the second O, linking home. Size follows font-size. */
export function Wordmark({ className }: WordmarkProps) {
  return (
    <Link
      href="/"
      aria-label="Quote.Vote home"
      className={cn(
        "inline-flex items-center leading-none font-extrabold tracking-[0.01em] whitespace-nowrap no-underline",
        "font-wordmark text-[var(--shell-ink)]",
        className
      )}
    >
      <span aria-hidden="true">QUOTE.V</span>
      <Globe aria-hidden="true" className="mx-[0.02em] -mt-[0.22em] h-[1.18em] w-auto" />
      <span aria-hidden="true">TE</span>
    </Link>
  );
}
