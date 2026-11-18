import Link from "next/link";
import { Wordmark } from "@/components/AppShell/Wordmark";
import { cn } from "@/lib/utils";
import type {
  AccessChip,
  AccessChipCardsProps,
  AccessHeadlineProps,
  AccessSplitLayoutProps,
} from "@/types/access";

const CHIP_LIGHT: Record<AccessChip["light"], string | undefined> = {
  post: undefined,
  up: "up",
  quote: "quote",
  comment: "comment",
};

function Headline({ lines, accent, className }: AccessHeadlineProps) {
  return (
    <p className={cn("qv-auth-display relative text-[#f6f5f1]", className)}>
      {lines.map((line) => (
        <span key={line} className="block">
          {line}
        </span>
      ))}
      <span className="qv-auth-accent block">{accent}</span>
    </p>
  );
}

function ChipCards({ chips }: AccessChipCardsProps) {
  return (
    <div className="flex w-[430px] max-w-full flex-col gap-3" aria-hidden="true">
      {chips.map((chip) => (
        <div
          key={chip.text}
          className="qv-lit"
          data-light={CHIP_LIGHT[chip.light]}
          style={chip.offset ? { marginLeft: chip.offset } : undefined}
        >
          <span className={`qv-tag qv-tag-${chip.tag}`}>{chip.label}</span>
          <span className="text-sm font-semibold text-[#c9d2cc]">{chip.text}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The split layout of the sign-in, forgot password, create account and new password
 * pages: a dark panel with the headline and chip cards on the left, the form on the right.
 * On phones the dark panel shrinks to a header and the form sits on a sheet below it.
 */
export function AccessSplitLayout({
  lines,
  accent,
  chips,
  prompt,
  action,
  formWidth = 420,
  children,
}: AccessSplitLayoutProps) {
  return (
    <div className="qv-auth flex min-h-screen flex-col bg-[var(--auth-surface)] lg:flex-row">
      {/* Desktop: dark panel */}
      <section className="qv-auth-hero relative hidden w-[640px] shrink-0 flex-col justify-between overflow-hidden px-[60px] py-[52px] lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-[640px]">
        <div className="qv-auth-glow" aria-hidden="true" />
        <Wordmark className="relative self-start text-[28px] text-[#f6f5f1]" />
        <div className="relative flex flex-col gap-7">
          <Headline lines={lines} accent={accent} className="text-[54px]" />
          <ChipCards chips={chips} />
        </div>
        <p className="relative m-0 text-[13px] font-semibold text-[#8fa197]">
          No ads, no algorithms · Open source, non-profit
        </p>
      </section>

      {/* Phone: dark header */}
      <section className="qv-auth-hero relative overflow-hidden px-[22px] pt-[22px] pb-[34px] lg:hidden">
        <div className="qv-auth-glow qv-auth-glow-sm" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-3">
          <Wordmark className="text-[20px] text-white" />
          <Link href={action.href} className="qv-auth-btn qv-auth-btn-sm qv-auth-hero-btn">
            {action.label}
          </Link>
        </div>
        <Headline lines={lines} accent={accent} className="mt-[30px] text-[32px]" />
      </section>

      <main className="relative -mt-[18px] flex flex-1 flex-col rounded-t-[var(--auth-sheet-radius)] bg-[var(--auth-surface)] lg:mt-0 lg:rounded-none">
        <div className="hidden items-center justify-end gap-3 px-8 py-6 lg:flex">
          <span className="qv-auth-muted text-sm font-semibold">{prompt}</span>
          <Link href={action.href} className="qv-auth-btn">
            {action.label}
          </Link>
        </div>
        <div className="flex flex-1 justify-center px-[22px] pt-[26px] pb-10 lg:items-center lg:px-8 lg:pt-0 lg:pb-12">
          <div className="w-full" style={{ maxWidth: formWidth }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
