import Link from "next/link";
import { Wordmark } from "@/components/AppShell/Wordmark";
import { NewsletterForm } from "@/components/Public/NewsletterForm";
import { Scene } from "@/components/Public/Scene";
import { COMMUNITIES } from "@/app/components/Landing/LandingSections";

/* The About page from the updated design (About, 1440 wide: plain up and down votes,
   Avataaars people). Phones stack the
   same sections, as the landing page does. */

const GITHUB_URL = "https://github.com/QuoteVote/quotevote-next";
const DONATE_URL = "https://opencollective.com/quotevote/donate";
const WRAP = "mx-auto w-full max-w-[1240px] px-4 sm:px-8 xl:px-0";

const RESULTS = [
  {
    text: "Bike lanes improve safety and reduce traffic for everyone.",
    up: 56,
    down: 12,
  },
  {
    text: "This works best when paired with better public transit.",
    up: 23,
    down: 5,
  },
  {
    text: "Parking is essential for small businesses to thrive.",
    up: 18,
    down: 41,
  },
];

const VALUES = [
  { title: "No ads", text: "Your attention belongs to you.", color: "#0e8a5a" },
  { title: "No engagement algorithms", text: "Chronological and transparent.", color: "#6d3fd1" },
  { title: "Open source", text: "Built in the open for the public good.", color: "#2457e6" },
  { title: "Everyone welcome", text: "Diverse views. Shared future.", color: "#0e8e9c" },
];

/* Same three audiences and scenes as the landing page, with About's shorter copy. */
const TILES = [
  { title: "Schools & universities", text: "Students lead. Ideas move. Change happens." },
  { title: "Teams & Enterprise", text: "Everyone’s voice. One game plan." },
  {
    title: "Organizations & government",
    text: "Stronger dialogue. Better decisions for everyone.",
  },
].map((t, i) => ({ ...t, scene: COMMUNITIES[i].scene }));

function AboutHeader() {
  return (
    <header className="flex h-16 items-center border-b border-[var(--pub-header-line)] px-4 sm:px-6 lg:h-[76px] lg:px-12">
      <Wordmark className="text-[22px] lg:text-[26px]" />
      <nav aria-label="Main" className="ml-auto flex gap-2">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="qv-auth-btn qv-auth-btn-ghost"
          aria-label="GitHub repository"
        >
          GitHub
        </a>
        <Link href="/auths/request-access" className="qv-auth-btn qv-auth-btn-primary">
          Request Invite
        </Link>
      </nav>
    </header>
  );
}

function AboutFooter() {
  return (
    <footer className="qv-pub-foot mt-14 pt-11 pb-8">
      <div className={`${WRAP} flex flex-col gap-8 md:flex-row md:gap-[72px]`}>
        <div className="flex flex-1 flex-col gap-2.5">
          <Wordmark className="text-2xl text-white" />
          <span className="text-sm text-[#b9c3d4]">
            A neutral public square. Powered by people.
          </span>
        </div>
        <nav aria-label="Platform" className="flex flex-col gap-2">
          <b className="text-[13px]">Platform</b>
          <Link href="/">Explore</Link>
          <Link href="/#how">How it Works</Link>
          <Link href="/#faq">FAQ</Link>
        </nav>
        <nav aria-label="About" className="flex flex-col gap-2">
          <b className="text-[13px]">About</b>
          <Link href="/about">Our Mission</Link>
          <Link href="/code-of-conduct">Code of Conduct</Link>
        </nav>
        <nav aria-label="Resources" className="flex flex-col gap-2">
          <b className="text-[13px]">Resources</b>
          <Link href="/contributing">Docs</Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
        <div className="flex flex-row gap-2.5 md:flex-col">
          <Link
            href="/auths/request-access"
            className="qv-auth-btn qv-auth-btn-sm qv-auth-btn-primary text-white!"
          >
            Request Invite
          </Link>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="qv-auth-btn qv-auth-btn-sm qv-auth-btn-blue text-white!"
          >
            Donate
          </a>
        </div>
      </div>
      <p
        className={`${WRAP} mt-8 border-t border-[#1f2a40] pt-[18px] text-[12.5px] text-[#8592a8]`}
      >
        © {new Date().getFullYear()} Quote.Vote. Open source and non-profit.
      </p>
    </footer>
  );
}

/** About: the mission, how voting on passages works, values, communities and how to help. */
export function AboutPageContent() {
  return (
    <div
      data-testid="about-page"
      className="qv-auth qv-pub flex min-h-screen flex-col overflow-x-hidden"
    >
      <AboutHeader />
      <main>
        <section
          className={`${WRAP} flex flex-col items-center gap-[22px] pt-12 pb-10 text-center lg:pt-[72px] lg:pb-12`}
        >
          <span className="qv-auth-label-yellow">Our mission</span>
          <h1 className="qv-auth-display m-0 max-w-[1000px] text-[40px]! sm:text-[56px]! lg:text-[78px]!">
            Better conversations start with{" "}
            <span className="text-[var(--pub-blue)]">specific ideas.</span>
          </h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6]! text-[var(--ra-body)] lg:text-[19px]">
            Discuss passages. Examine claims. Share perspectives. Quote.Vote is a nonprofit,
            open-source platform for text-based dialogue and decisions communities can stand behind.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auths/request-access"
              className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg"
            >
              Request Invite
            </Link>
            <Link href="/" className="qv-auth-btn qv-auth-btn-lg qv-pub-btn-outline-blue">
              Explore Discussions
            </Link>
          </div>
        </section>

        <section className={WRAP}>
          <div className="flex flex-col gap-8 rounded-[24px] bg-[linear-gradient(120deg,#f1f6ff,#f2faf6)] p-5 lg:flex-row lg:items-center lg:gap-11 lg:rounded-[28px] lg:p-9 [.dark_&]:bg-[linear-gradient(120deg,#111d36,#0f2219)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--pub-line)]">
            <div className="flex flex-col gap-4 lg:w-[380px]">
              <h2 className="qv-auth-display m-0 text-[30px]! lg:text-[40px]!">
                Structured dialogue. Better decisions.
              </h2>
              <p className="qv-auth-muted m-0 text-base leading-normal! font-semibold">
                Real conversations with real impact.
              </p>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[15px] font-semibold">
                {[
                  "Context and evidence over noise",
                  "Respectful dialogue at scale",
                  "Agreement you can see, dissent you can read",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span
                      className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#0e8a5a] text-xs text-white"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="qv-pub-panel flex-1 px-[18px] py-4 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]! lg:px-[26px] lg:py-[22px]">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="qv-pub-av size-6" aria-hidden="true" />
                <b>anareyes</b>
                <span className="qv-auth-muted">· 3h ago</span>
                <span className="qv-pub-chip qv-pub-chip-green ml-auto h-6! text-[11.5px]!">
                  # Transport
                </span>
              </div>
              <h3 className="qv-auth-display mt-2.5 mb-1 text-[19px]! tracking-[-0.02em]! lg:text-[22px]!">
                Should cities prioritize bike lanes or parking?
              </h3>
              <p className="qv-auth-muted mt-0 mb-1.5 text-[13px] font-semibold">
                12 quotes · 84 votes · 37 comments
              </p>
              {RESULTS.map((r, i) => (
                <div
                  key={r.text}
                  className={`flex flex-col gap-2 py-3.5 ${i < RESULTS.length - 1 ? "border-b border-[#eef1f6] [.dark_&]:border-[#1b2640]" : ""}`}
                >
                  <div className="flex justify-between gap-4">
                    <span className="text-[14.5px] font-semibold">“{r.text}”</span>
                    <span className="flex gap-2.5 text-[13px] font-extrabold">
                      <span className="text-[#11683d]">↑ {r.up}</span>
                      <span className="text-[#a12424]">↓ {r.down}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="What Quote.Vote stands for" className={`${WRAP} mt-14`}>
          <div className="grid grid-cols-2 gap-y-5 rounded-[22px] border border-[var(--pub-line)] py-6 lg:grid-cols-4 lg:gap-y-0 [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:shadow-[var(--pub-panel-shadow)]">
            {VALUES.map((v, i) => (
              <div
                key={v.title}
                className={`flex flex-col items-center gap-2 border-dashed border-[var(--pub-line-2)] px-5 text-center ${i % 2 === 1 ? "border-l" : ""} ${i === 2 ? "lg:border-l" : ""}`}
              >
                <b className="text-[17px]" style={{ color: v.color }}>
                  {v.title}
                </b>
                <span className="qv-auth-muted text-sm">{v.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${WRAP} mt-14 flex flex-col items-center gap-[22px]`}>
          <h2 className="qv-auth-display m-0 text-center text-[30px]! lg:text-[40px]!">
            Built for every community
          </h2>
          <p className="qv-auth-muted m-0 text-center text-base leading-normal! font-semibold">
            From classrooms to city halls, Quote.Vote helps any group decide together.
          </p>
          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
            {TILES.map((t) => (
              <div key={t.title} className="qv-pub-card flex flex-col rounded-[20px]!">
                <div className="h-[220px]">
                  <Scene {...t.scene} size="card" />
                </div>
                <h3 className="m-0 px-[18px] pt-4 pb-1 text-[17px]! leading-normal! font-bold">
                  {t.title}
                </h3>
                <span className="qv-auth-muted px-[18px] pb-[18px] text-[13.5px] leading-[1.5]">
                  {t.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${WRAP} mt-14`}>
          <div className="grid grid-cols-1 overflow-hidden rounded-[24px] border border-[var(--pub-join-line)] bg-[var(--pub-join-bg)] lg:grid-cols-[1.2fr_1fr_0.8fr] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2">
            <div className="p-[30px]">
              <h2 className="qv-auth-display m-0 text-[26px]!">
                Join us in creating a truly open and equal community.
              </h2>
              <p className="mt-3 mb-0 text-[14.5px] leading-[1.6]! text-[var(--ra-body)]">
                Quote.Vote is nonprofit, open source and donation-supported. Our only funding comes
                from people like you.
              </p>
            </div>
            <div className="border-t border-[var(--pub-join-line)] p-[30px] lg:border-t-0 lg:border-l">
              <h3 className="qv-auth-display m-0 text-[22px]!">Please be in touch!</h3>
              <p className="qv-auth-muted mt-2 mb-3.5 text-[13.5px] leading-[1.5]!">
                Sign up for our newsletter. We’ll send updates as we make progress.
              </p>
              <NewsletterForm id="about-newsletter" variant="desktop" />
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--pub-join-line)] bg-[var(--auth-surface)] p-[30px] lg:border-t-0 lg:border-l">
              <b className="text-[15px]">Help keep Quote.Vote free for everyone.</b>
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="qv-auth-btn qv-auth-btn-blue"
                aria-label="Donate to Quote.Vote today (opens in a new tab)"
              >
                Donate Today
              </a>
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="qv-auth-link text-[13px] font-bold"
              >
                Learn more about donations →
              </a>
            </div>
          </div>
        </section>
      </main>
      <AboutFooter />
    </div>
  );
}
