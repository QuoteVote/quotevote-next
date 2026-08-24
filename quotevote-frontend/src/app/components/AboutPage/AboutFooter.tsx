import Link from "next/link";
import { Heart } from "lucide-react";
import { Globe } from "@/components/Icons";

const PLATFORM_LINKS = [
  { href: "/", label: "Explore" },
  { href: "#how-it-works", label: "How it Works" },
  { href: "/plan", label: "Pricing" },
  { href: "mailto:admin@quote.vote", label: "FAQ" },
] as const;

const ABOUT_LINKS = [
  { href: "#values", label: "Our Mission" },
  { href: "/contributing", label: "Team" },
  { href: "/contributing", label: "Blog" },
  { href: "mailto:admin@quote.vote", label: "Press" },
] as const;

const RESOURCE_LINKS = [
  { href: "/contributing", label: "Docs" },
  { href: "https://github.com/QuoteVote/quotevote-next", label: "GitHub", external: true },
  { href: "/code-of-conduct", label: "Community" },
  { href: "mailto:admin@quote.vote", label: "Contact" },
] as const;

/**
 * Navy Zeplin footer for the About page. Only links to real app routes or mailto/GitHub.
 */
export function AboutFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="overflow-hidden bg-[#0A2342] text-white" role="contentinfo">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8 lg:py-16">
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <Link
            href="/"
            className="inline-flex rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]"
            aria-label="Quote.Vote home"
          >
            <span className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#20E08E] via-[#1BB5D8] to-[#4066EC] p-2.5">
              <Globe size={56} className="size-14" showSignal={false} />
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Quote.Vote A neutral public square. Powered by people.
          </p>
        </div>

        <FooterColumn title="Platform" links={PLATFORM_LINKS} />
        <FooterColumn title="About" links={ABOUT_LINKS} />
        <FooterColumn title="Resources" links={RESOURCE_LINKS} />
        <div className="flex min-w-0 flex-col gap-3 sm:max-w-[12.5rem]">
          <Link
            href="/auths/request-access"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#22c55e] px-4 text-sm font-semibold text-white hover:bg-[#16a34a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]"
            aria-label="Request an invite to join Quote.Vote"
          >
            Request Invite
          </Link>
          <a
            href="https://opencollective.com/quotevote/donate"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#7c3aed] px-4 text-sm font-semibold text-white hover:bg-[#6d28d9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed]"
            aria-label="Donate to Quote.Vote (opens in new tab)"
          >
            Donate
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-sm text-white/50 sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <p>© {year} Quote.Vote. All rights reserved.</p>
          <p className="inline-flex items-center gap-1.5">
            Quote Vote made with
            <Heart className="size-3.5 fill-[#22c55e] text-[#22c55e]" aria-hidden />
            on Earth.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string; external?: boolean }>;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#22c55e]">{title}</h2>
      <ul className="mt-4 space-y-2">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]"
              >
                {link.label}
              </a>
            ) : link.href.startsWith("mailto:") ? (
              <a
                href={link.href}
                className="text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e]"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
