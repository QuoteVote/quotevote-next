import type { ReactNode } from "react";

/** A titled group in the home page's left column. */
export function FeedOptionsSection({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2
        id={id}
        className="mb-2.5 text-[11.5px]! leading-[1.3]! font-extrabold! tracking-[0.09em]! text-[var(--shell-muted)] uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
