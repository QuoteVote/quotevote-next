import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { EditorSectionProps } from "@/types/avatar";

/** A titled block in an editor tab, separated from the next one by a thin rule. */
export function EditorSection({
  title,
  value,
  note,
  children,
  className,
}: EditorSectionProps): ReactNode {
  return (
    <section
      className={cn(
        "border-b border-[var(--ae-line-3)] py-4 last:border-b-0 last:pb-0 lg:py-5",
        className
      )}
    >
      <header className="mb-3.5 flex items-baseline gap-2.5">
        <h3 className="m-0 text-[15px]! leading-snug! font-extrabold! tracking-normal! text-[var(--ae-ink)]">
          {title}
        </h3>
        {value ? (
          <span className="ml-auto text-[13px] font-bold text-[var(--ae-ink)]" aria-live="polite">
            {value}
          </span>
        ) : note ? (
          <span className="ml-auto text-[13px] font-semibold text-[var(--ae-muted)]">{note}</span>
        ) : null}
      </header>
      {children}
    </section>
  );
}

/** Small uppercase label above a group of tiles, e.g. "SHORT". */
export function SubLabel({ children }: { children: ReactNode }): ReactNode {
  return (
    <p className="m-0 mb-2.5 text-xs font-bold tracking-[0.06em] text-[var(--ae-muted-2)] uppercase">
      {children}
    </p>
  );
}
