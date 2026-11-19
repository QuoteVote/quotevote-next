"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/AppShell/Wordmark";
import type { DocsLayoutProps, DocsPageId } from "@/types/access";

const DOCS: { id: DocsPageId; label: string; href: string }[] = [
  { id: "terms", label: "Terms of Service", href: "/terms" },
  { id: "conduct", label: "Code of Conduct", href: "/code-of-conduct" },
  { id: "contributing", label: "Contributing", href: "/contributing" },
];

/**
 * Terms, Code of Conduct and Contributing, from the approved design (Docs): the
 * document list on the left, a reading column, and a contents list that follows you.
 */
export function DocsLayout({ current, title, eyebrow, intro, sections }: DocsLayoutProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="qv-auth qv-pub min-h-screen bg-[var(--inv-ground)]!">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[var(--anav-line,#e4e2da)] bg-[var(--auth-surface)] px-4 sm:px-7 lg:h-[72px]">
        <Wordmark className="text-[22px] lg:text-2xl" />
        <Link href="/auths/request-access" className="qv-auth-btn qv-auth-btn-primary ml-auto">
          Request Invite
        </Link>
      </header>
      <div className="mx-auto flex max-w-[1216px] flex-col gap-6 px-4 pt-8 pb-16 sm:px-8 lg:flex-row lg:gap-12 lg:pt-11 xl:px-0">
        <nav
          aria-label="Policies"
          className="flex shrink-0 gap-1 overflow-x-auto lg:w-[220px] lg:flex-col"
        >
          {DOCS.map((d) => (
            <Link
              key={d.id}
              href={d.href}
              aria-current={d.id === current ? "page" : undefined}
              className={`flex h-11 shrink-0 items-center rounded-[12px] px-3.5 text-[14.5px] font-semibold no-underline [.neo-brutalism_&]:rounded-[4px] ${
                d.id === current
                  ? "bg-[#16201b] text-white [.dark_&]:bg-[#e8edf5] [.dark_&]:text-[#0d1526]"
                  : "text-[#2a3530] hover:bg-[#efeee8] [.dark_&]:text-[var(--auth-ink-2)] [.dark_&]:hover:bg-[#1b2640]"
              }`}
            >
              {d.label}
            </Link>
          ))}
        </nav>

        <main className="flex max-w-[720px] min-w-0 flex-1 flex-col gap-5">
          {eyebrow && <p className="qv-auth-eyebrow m-0">{eyebrow}</p>}
          <h1 className="qv-auth-display m-0 text-[38px]! lg:text-[56px]!">{title}</h1>
          <p className="m-0 text-lg leading-[1.7]! text-[#2a3530] lg:text-[21px] [.dark_&]:text-[var(--auth-ink-2)]">
            {intro}
          </p>
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-title`}
              className="flex scroll-mt-24 flex-col gap-3"
            >
              <h2
                id={`${s.id}-title`}
                className="qv-auth-display mt-3 mb-0 text-[24px]! lg:text-[28px]!"
              >
                {i + 1}. {s.title}
              </h2>
              <div className="flex flex-col gap-3 text-[17px] leading-[1.7] text-[#2a3530] [.dark_&]:text-[var(--auth-ink-2)]">
                {s.body}
              </div>
              {s.short && (
                <div className="rounded-[14px] border-l-4 border-[#52b274] bg-[#e5f2ea] px-5 py-[18px] text-[15px] leading-[1.6] [.dark_&]:bg-[#12382a] [.neo-brutalism_&]:rounded-[4px]">
                  <b>In short:</b> {s.short}
                </div>
              )}
            </section>
          ))}
        </main>

        {sections.length > 0 && (
          <aside
            aria-label="On this page"
            className="hidden w-[220px] shrink-0 flex-col gap-0.5 pt-10 lg:sticky lg:top-24 lg:flex lg:self-start"
          >
            <span className="qv-auth-eyebrow">On this page</span>
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? "location" : undefined}
                className={`block border-l-2 py-1.5 pl-3 text-[13.5px] no-underline ${
                  active === s.id
                    ? "border-[#1f7a4d] font-semibold text-[#16201b] [.dark_&]:text-[var(--auth-ink)]"
                    : "border-[#e4e2da] text-[#56615b] [.dark_&]:border-[#24304a] [.dark_&]:text-[var(--auth-muted)]"
                }`}
              >
                {i + 1}. {s.title}
              </a>
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}
