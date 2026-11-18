import type { InviteEmptyStateProps } from "@/types/admin";

/** Dashed panel shown when a list has no invites. */
export function InviteEmptyState({ title, text }: InviteEmptyStateProps) {
  return (
    <section className="qv-inv-panel flex items-center gap-4 border-dashed! p-[22px] shadow-none!">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--ra-tint-green)] text-[#0f7d56]"
        aria-hidden="true"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </span>
      <div>
        <p className="m-0 text-base leading-normal! font-bold">{title}</p>
        <p className="qv-auth-muted m-0 text-[13.5px] leading-normal! font-semibold">{text}</p>
      </div>
    </section>
  );
}
