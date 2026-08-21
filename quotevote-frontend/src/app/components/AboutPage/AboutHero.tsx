import Image from "next/image";
import Link from "next/link";
import { aboutSrc } from "./aboutAssets";

/**
 * About hero: headline, CTAs, Zeplin avatars, and post/chat mockup.
 */
export function AboutHero() {
  return (
    <section className="overflow-hidden bg-white" aria-labelledby="about-hero-heading">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:py-12">
        <div className="min-w-0">
          <h1
            id="about-hero-heading"
            className="text-3xl font-extrabold leading-[1.12] tracking-tight text-[#0A2342] sm:text-5xl lg:text-6xl"
          >
            Better conversations build <span className="text-[#22c55e]">stronger</span>{" "}
            <span className="text-[#7c3aed]">communities.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
            Quote.Vote is a neutral public square for structured dialogue. Highlight what matters,
            vote on ideas, and find common ground across any divide.
          </p>
          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/auths/request-access"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#22c55e] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(34,197,94,0.28)] transition-opacity hover:bg-[#16a34a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 sm:w-auto"
              aria-label="Request an invite to join Quote.Vote"
            >
              Request Invite
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#7c3aed] bg-white px-6 py-3 text-sm font-semibold text-[#7c3aed] transition-colors hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 sm:w-auto"
            >
              Explore Discussions
            </Link>
          </div>
          <div className="mt-6 flex min-w-0 flex-col items-start gap-3">
            <Image
              src={aboutSrc("hero-avatars.png")}
              alt=""
              width={936}
              height={243}
              unoptimized
              className="h-10 w-auto max-w-[220px] object-contain object-left sm:h-12"
            />
            <p className="min-w-0 text-sm text-slate-500">
              Join thousands of people building a better world — together.
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full min-w-0 max-w-md lg:max-w-none" aria-hidden>
          <Image
            src={aboutSrc("hero-mockup.png")}
            alt=""
            width={1315}
            height={1024}
            className="h-auto w-full max-w-lg object-contain lg:max-w-none"
            unoptimized
            priority
          />
        </div>
      </div>
    </section>
  );
}
