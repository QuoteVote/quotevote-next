import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/Public/NewsletterForm";
import type { LandingStepExampleProps } from "@/types/access";

/* The landing page's static sections, from the approved design (GuestHome and
   LandingMobile). Sizes follow the design at 1440 wide; phones get the shorter
   copy and stacked layout of the phone design. */

const WRAP = "mx-auto w-full max-w-[1240px] px-4 sm:px-8 xl:px-0";
const SECTION = `${WRAP} pt-14 lg:pt-24`;
const H2 = "qv-auth-display m-0 text-[30px]! lg:text-[46px]!";
const LEAD =
  "qv-auth-muted m-0 text-[15px] font-semibold leading-normal! lg:mb-[18px] lg:text-[17px]";

function Check() {
  return (
    <span
      className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#0e8a5a] text-xs text-white"
      aria-hidden="true"
    >
      ✓
    </span>
  );
}

export function LandingHero() {
  return (
    <section
      className={`${WRAP} relative flex flex-col items-center gap-8 pt-6 lg:flex-row lg:gap-12 lg:pt-16`}
    >
      <div
        aria-hidden="true"
        className="absolute top-2.5 -left-[110px] hidden size-[200px] rounded-full border-[20px] border-[#e6f6ee] lg:block [.dark_&]:border-[#12382a]"
      />
      <div
        aria-hidden="true"
        className="absolute top-[470px] -right-[60px] hidden size-[120px] rounded-full border-[16px] border-[#e9f0ff] lg:block [.dark_&]:border-[#13324a]"
      />
      <div className="relative flex flex-1 flex-col gap-5 lg:gap-6">
        <span className="qv-pub-kicker">
          <span className="lg:hidden">Nonprofit · Open source</span>
          <span className="hidden lg:inline">Nonprofit · Open source · Invite-only</span>
        </span>
        <h1 className="qv-auth-display m-0 text-[38px]! leading-[1.03]! lg:text-[66px]!">
          Better conversations build <span className="text-[var(--pub-green)]">stronger</span>{" "}
          <span className="text-[var(--pub-blue)]">communities.</span>
        </h1>
        <p className="m-0 max-w-[500px] text-[16.5px] leading-[1.6]! text-[var(--ra-body)] lg:text-[18.5px]">
          <span className="lg:hidden">
            Vote on the exact words that matter, talk them through and find common ground. No ads.
            No algorithms.
          </span>
          <span className="hidden lg:inline">
            Quote.Vote is a text-first platform where people vote on the exact words that matter,
            talk them through, and find common ground. No ads. No algorithms.
          </span>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auths/request-access"
            className="qv-auth-btn qv-auth-btn-primary qv-auth-btn-lg"
          >
            Request Invite
          </Link>
          <a href="#feed" className="qv-auth-btn qv-auth-btn-lg qv-pub-btn-outline-blue">
            Explore Discussions
          </a>
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <span className="flex" aria-hidden="true">
            <span className="qv-pub-av size-9 border-2 border-white" />
            <span className="qv-pub-av qv-pub-av-b -ml-2.5 size-9 border-2 border-white" />
            <span className="qv-pub-av qv-pub-av-c -ml-2.5 size-9 border-2 border-white" />
            <span className="qv-pub-av qv-pub-av-e -ml-2.5 size-9 border-2 border-white" />
          </span>
          <span className="qv-auth-muted text-[13.5px] font-semibold">
            People building better conversations, together.
          </span>
        </div>
      </div>

      <div className="relative w-full shrink-0 lg:h-[540px] lg:w-[640px]">
        <div
          role="img"
          aria-label="People around a table discussing quotes on a shared screen"
          className="aspect-[640/540] w-full rounded-[24px] bg-[url('/assets/redesign/scene-dialogue.jpg')] bg-no-repeat [background-position:50%_80%] [background-size:103.125%_auto] lg:h-[540px] lg:rounded-[32px]"
        />
        {/* Phone: one short quote card over the picture */}
        <div className="qv-pub-pop absolute right-3 -bottom-6 left-3 flex flex-col gap-2 p-3.5 lg:hidden">
          <p className="m-0 text-[14.5px] leading-[1.6]!">
            “It’s about <span className="qv-pub-mark">building equitable, livable communities</span>
            .”
          </p>
          <div className="flex items-center gap-2.5">
            <span className="qv-pub-bar flex-1">
              <span style={{ width: "68%", background: "#16a06a" }} />
            </span>
            <b className="text-[12.5px]">68% agree</b>
          </div>
        </div>
        {/* Desktop: the post card and Top reactions */}
        <article className="qv-pub-pop absolute -bottom-[30px] -left-20 hidden w-[416px] flex-col gap-3 p-[18px] lg:flex">
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="qv-pub-av size-6" aria-hidden="true" />
            <b>anareyes</b>
            <span className="qv-auth-muted">· 2h ago</span>
            <span className="qv-pub-chip qv-pub-chip-green ml-auto h-6! text-[11.5px]!">
              # Transport
            </span>
          </div>
          <p className="m-0 text-[15px] leading-[1.6]!">
            “Public transit is not just about getting from A to B. It’s about{" "}
            <span className="qv-pub-mark">building equitable, livable communities</span>.”
          </p>
          <div className="flex flex-col gap-1.5">
            <b className="text-[12.5px]">68% Agree</b>
            <span className="qv-pub-bar">
              <span style={{ width: "68%", background: "#16a06a" }} />
            </span>
          </div>
          <div className="flex gap-4 text-[13px] font-bold text-[var(--auth-ink-2)]">
            <span className="text-[#0e8a5a]">↑ 128</span>
            <span>34 comments</span>
            <span>23 quotes</span>
          </div>
        </article>
        <div
          className="qv-pub-pop absolute top-10 -right-6 hidden w-[228px] flex-col gap-2.5 p-3.5 lg:flex"
          aria-hidden="true"
        >
          <b className="text-xs text-[var(--auth-muted)]">Top reactions</b>
          {[
            { tag: "qv-auth-tag-up", label: "Agree", width: "68%", color: "#16a06a" },
            { tag: "qv-auth-tag-info", label: "True", width: "18%", color: "#2f66f0" },
            { tag: "qv-tag-quote", label: "Quote", width: "14%", color: "#7c4ddb" },
          ].map((r) => (
            <span key={r.label} className="flex items-center gap-2">
              <span className={`qv-auth-tag ${r.tag} w-16`}>{r.label}</span>
              <span className="qv-pub-bar flex-1">
                <span style={{ width: r.width, background: r.color }} />
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const VALUES = [
  {
    title: "No ads",
    text: "Your attention belongs to you.",
    short: "Your attention is yours.",
    color: "#0e8a5a",
    tint: "qv-pub-tint-green",
    icon: (
      <>
        <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  },
  {
    title: "No algorithms",
    text: "Chronological and transparent.",
    short: "Chronological.",
    color: "#6d3fd1",
    tint: "qv-pub-tint-purple",
    icon: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <path d="M4 4l16 16" />
      </>
    ),
  },
  {
    title: "Open source",
    text: "Built in the open for the public good.",
    short: "Built in the open.",
    color: "#2457e6",
    tint: "qv-pub-tint-blue",
    icon: <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />,
  },
  {
    title: "Everyone welcome",
    text: "Diverse views. Shared future.",
    short: "Shared future.",
    color: "#0e8e9c",
    tint: "qv-pub-tint-yellow",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M2 20a7 7 0 0 1 14 0M15 20a5 5 0 0 1 7-4.5" />
      </>
    ),
  },
];

export function LandingValues() {
  return (
    <section aria-label="What Quote.Vote stands for" className={`${WRAP} mt-14 lg:mt-[72px]`}>
      {/* Phone: four tinted tiles */}
      <div className="grid grid-cols-2 gap-2.5 lg:hidden">
        {VALUES.map((v) => (
          <div
            key={v.title}
            className={`${v.tint} rounded-[16px] p-3.5 [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--pub-line)]`}
          >
            <b
              className="block text-[17px] leading-tight"
              style={{ color: v.title === "Everyone welcome" ? "#875a0e" : v.color }}
            >
              {v.title}
            </b>
            <span className="qv-auth-muted text-[13px]">{v.short}</span>
          </div>
        ))}
      </div>
      {/* Desktop: one strip */}
      <div className="hidden grid-cols-4 rounded-[22px] border border-[var(--pub-line)] bg-[var(--pub-soft)] py-[26px] lg:grid [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:shadow-[var(--pub-panel-shadow)]">
        {VALUES.map((v, i) => (
          <div
            key={v.title}
            className="flex flex-col items-center gap-2 px-[22px] py-1.5 text-center"
            style={i > 0 ? { borderLeft: "1px dashed var(--pub-line-2)" } : undefined}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke={v.color}
              strokeWidth="2"
              aria-hidden="true"
            >
              {v.icon}
            </svg>
            <b className="text-base" style={{ color: v.color }}>
              {v.title}
            </b>
            <span className="qv-auth-muted text-[13.5px] leading-[1.5]">{v.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: 1,
    title: "Quote",
    text: "Highlight the parts that matter and bring them into the discussion.",
    short: "Highlight the parts that matter.",
    color: "#0e8a5a",
  },
  {
    n: 2,
    title: "Vote",
    text: "Agree or disagree, true or false, like or dislike, on exactly those words.",
    short: "Agree or disagree, true or false, like or dislike.",
    color: "#2457e6",
  },
  {
    n: 3,
    title: "Deliberate",
    text: "Discuss in the post’s room, add context and find common ground.",
    short: "Discuss and find common ground.",
    color: "#6d3fd1",
  },
];

function StepExample({ n }: LandingStepExampleProps) {
  if (n === 1) {
    return (
      <div className="qv-pub-tint-green rounded-[14px] p-3.5 text-sm leading-[1.6]">
        “Community input helps create <span className="qv-pub-mark">better solutions</span> for
        everyone.”
      </div>
    );
  }
  if (n === 2) {
    const up = ["Agree", "True", "Like"];
    const down = ["Disagree", "False", "Dislike"];
    return (
      <div
        className="qv-pub-tint-blue grid grid-cols-3 gap-1.5 rounded-[14px] p-3.5 text-center text-[11.5px] font-extrabold"
        aria-hidden="true"
      >
        {up.map((l) => (
          <span key={l} className="rounded-[9px] bg-[#e3f6ea] py-[9px] text-[#11683d]">
            {l}
          </span>
        ))}
        {down.map((l) => (
          <span key={l} className="rounded-[9px] bg-[#fde7e7] py-[9px] text-[#a12424]">
            {l}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="qv-pub-tint-purple flex flex-col gap-2.5 rounded-[14px] p-3.5">
      <span className="flex items-center gap-2">
        <span className="qv-pub-av qv-pub-av-b size-6" aria-hidden="true" />
        <span className="text-[12.5px] font-semibold">
          The pilot cut my commute by ten minutes.
        </span>
      </span>
      <span className="flex items-center gap-2">
        <span className="qv-pub-av qv-pub-av-c size-6" aria-hidden="true" />
        <span className="text-[12.5px] font-semibold">Then write the fund into the ordinance.</span>
      </span>
    </div>
  );
}

export function LandingHowItWorks() {
  return (
    <section id="how" className={`${SECTION} flex scroll-mt-20 flex-col gap-3.5 lg:items-center`}>
      <span className="qv-pub-kicker">
        <span className="lg:hidden">How it works</span>
        <span className="hidden lg:inline">How Quote.Vote works</span>
      </span>
      <h2 className={`${H2} lg:text-center`}>
        Quote. Discuss.{" "}
        <span className="text-[var(--pub-blue)]">
          <span className="lg:hidden">Vote.</span>
          <span className="hidden lg:inline">Vote on what matters.</span>
        </span>
      </h2>
      <p className={`${LEAD} hidden lg:block`}>
        Three steps that turn a noisy thread into clear priorities.
      </p>
      <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-5">
        {STEPS.map((s) => (
          <div key={s.n} className="qv-pub-panel flex gap-3.5 p-4 lg:flex-col lg:p-6">
            <span
              className="flex size-[30px] shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white lg:hidden"
              style={{ background: s.color }}
            >
              {s.n}
            </span>
            <div className="flex flex-col gap-1 lg:gap-3.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="hidden size-[30px] items-center justify-center rounded-full text-[13px] font-extrabold text-white lg:flex"
                  style={{ background: s.color }}
                >
                  {s.n}
                </span>
                <h3 className="m-0 text-[17px]! leading-normal! font-bold">{s.title}</h3>
              </div>
              <span className="qv-auth-muted text-sm font-semibold">
                <span className="lg:hidden">{s.short}</span>
                <span className="hidden lg:inline">{s.text}</span>
              </span>
              <div className="hidden lg:block">
                <StepExample n={s.n} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const RESULTS = [
  {
    text: "Bike lanes improve safety and reduce traffic for everyone.",
    short: "Bike lanes improve safety for everyone.",
    up: 56,
    down: 12,
    pct: 82,
    color: "#16a06a",
    phone: true,
  },
  {
    text: "This works best when paired with better public transit.",
    short: "",
    up: 23,
    down: 5,
    pct: 82,
    color: "#2f66f0",
    phone: false,
  },
  {
    text: "Parking is essential for small businesses to thrive.",
    short: "Parking is essential for small businesses.",
    up: 18,
    down: 41,
    pct: 30,
    color: "#f6c343",
    phone: true,
  },
];

export function LandingInAction() {
  return (
    <section className={SECTION}>
      <div className="flex flex-col gap-6 rounded-[24px] bg-[linear-gradient(120deg,#f1f6ff,#f2faf6)] p-5 lg:flex-row lg:items-center lg:gap-12 lg:rounded-[32px] lg:p-12 [.dark_&]:bg-[linear-gradient(120deg,#111d36,#0f2219)] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--pub-line)]">
        <div className="flex flex-col gap-[18px] lg:w-[420px]">
          <span className="qv-pub-kicker">See it in action</span>
          <h2 className="qv-auth-display m-0 text-[28px]! lg:text-[42px]!">
            Vote on the words, not the person.
          </h2>
          <p className="m-0 hidden text-base leading-[1.6]! text-[var(--ra-body)] lg:block">
            Select any passage in a quote and respond to exactly what was said. Everyone sees where
            agreement is strong and where it isn’t.
          </p>
          <ul className="m-0 hidden list-none flex-col gap-2.5 p-0 text-[15px] font-semibold lg:flex">
            {[
              "Context and evidence over noise",
              "Respectful dialogue at scale",
              "Agreement you can see, dissent you can read",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex-1">
          <div className="qv-pub-panel px-[18px] py-4 shadow-[0_20px_44px_-26px_rgba(15,23,42,0.35)]! lg:px-[26px] lg:py-6">
            <div className="hidden items-center gap-2 text-[13px] lg:flex">
              <span className="qv-pub-av qv-pub-av-d size-6" aria-hidden="true" />
              <b>sambrooks</b>
              <span className="qv-auth-muted">· 3h ago</span>
              <span className="qv-pub-chip qv-pub-chip-green ml-auto h-6! text-[11.5px]!">
                # Transport
              </span>
            </div>
            <h3 className="qv-auth-display m-0 text-[17px]! tracking-[-0.02em]! lg:mt-3 lg:mb-0.5 lg:text-[22px]!">
              Should cities prioritize bike lanes or parking?
            </h3>
            <p className="qv-auth-muted mt-0 mb-1 hidden text-[13px] font-semibold lg:block">
              12 quotes · 84 votes · 37 comments
            </p>
            {RESULTS.map((r, i) => (
              <div
                key={r.text}
                className={`flex-col gap-2 py-3.5 lg:flex ${r.phone ? "flex" : "hidden"} ${i < RESULTS.length - 1 ? "border-b border-[#eef1f6] [.dark_&]:border-[#1b2640]" : ""}`}
              >
                <div className="flex justify-between gap-4">
                  <span className="text-[14.5px] font-semibold">
                    <span className="lg:hidden">“{r.short}”</span>
                    <span className="hidden lg:inline">“{r.text}”</span>
                  </span>
                  <span className="hidden gap-2.5 text-[13px] font-extrabold lg:flex">
                    <span className="text-[#11683d]">+{r.up}</span>
                    <span className="text-[#a12424]">−{r.down}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="qv-pub-bar flex-1">
                    <span style={{ width: `${r.pct}%`, background: r.color }} />
                  </span>
                  <b className="text-[12.5px]">
                    {r.pct}%<span className="hidden lg:inline"> agree</span>
                  </b>
                </div>
              </div>
            ))}
          </div>
          <div
            className="qv-pub-pop absolute -right-7 -bottom-14 hidden w-[308px] grid-cols-2 gap-2 p-3.5 lg:grid"
            aria-hidden="true"
          >
            {[
              { label: "↑ Agree", up: true },
              { label: "↓ Disagree", up: false },
              { label: "✓ True", up: true },
              { label: "✕ False", up: false },
            ].map((v) => (
              <span
                key={v.label}
                className={`flex h-[46px] items-center gap-2.5 rounded-[12px] px-3.5 text-sm font-bold ${v.up ? "bg-[#e7f6ec] text-[#11683d]" : "bg-[#fdebeb] text-[#a12424]"}`}
              >
                {v.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const COMMUNITIES = [
  {
    title: "Schools & universities",
    text: "Students lead. Ideas move. Change happens. Weigh in on fees, safety and campus life.",
    short: "Students lead. Ideas move.",
    image: "scene-students",
    position: "-12px -240px",
    alt: "Students discussing activity fees",
  },
  {
    title: "Teams & projects",
    text: "Everyone’s voice. One game plan. Decide on schedules, priorities and plans together.",
    short: "Everyone’s voice. One game plan.",
    image: "scene-team",
    position: "-12px -232px",
    alt: "A sports team planning a tournament",
  },
  {
    title: "Local government",
    text: "Stronger dialogue. Better decisions for everyone, from budgets to bike lanes.",
    short: "Better decisions for everyone.",
    image: "scene-dialogue",
    position: "-12px -262px",
    alt: "A group reviewing quotes on a shared screen",
  },
];

const MINIS = [
  {
    title: "Parent groups",
    text: "Turn different ideas into shared priorities for your school or daycare.",
    tint: "qv-pub-tint-yellow",
    ic: "bg-[#fcebb6] text-[#875a0e]",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 20a7 7 0 0 1 14 0" />
        <circle cx="18" cy="11" r="2.5" />
      </>
    ),
  },
  {
    title: "Unions & organizations",
    text: "Hear every member before you take a position.",
    tint: "qv-pub-tint-blue",
    ic: "bg-[#dce7ff] text-[#2457e6]",
    icon: (
      <>
        <path d="M4 21V9l8-6 8 6v12" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
  },
  {
    title: "Nonprofits & advocacy",
    text: "Build proposals your community actually backs.",
    tint: "qv-pub-tint-purple",
    ic: "bg-[#e6dcfc] text-[#6d3fd1]",
    icon: <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />,
  },
];

export function LandingCommunities() {
  return (
    <section
      id="communities"
      className={`${SECTION} flex scroll-mt-20 flex-col gap-3.5 lg:items-center`}
    >
      <span className="qv-pub-kicker">Use cases</span>
      <h2 className={H2}>Built for every community</h2>
      <p className={`${LEAD} hidden lg:block`}>
        From classrooms to city halls, Quote.Vote helps any group make better decisions together.
      </p>
      <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-5">
        {COMMUNITIES.map((c) => (
          <div
            key={c.title}
            className="qv-pub-card flex items-center gap-3 p-2.5 lg:flex-col lg:items-stretch lg:gap-0 lg:p-0"
          >
            <div
              role="img"
              aria-label={c.alt}
              className="size-24 shrink-0 rounded-[12px] bg-no-repeat lg:h-[250px] lg:w-full lg:rounded-none"
              style={{
                backgroundImage: `url('/assets/redesign/${c.image}.jpg')`,
                backgroundSize: "420px auto",
                backgroundPosition: c.position,
              }}
            />
            <div className="flex flex-col">
              <h3 className="m-0 text-base! leading-normal! font-bold lg:px-5 lg:pt-[18px] lg:pb-1 lg:text-lg!">
                {c.title}
              </h3>
              <span className="qv-auth-muted text-sm leading-[1.55] lg:px-5 lg:pb-5">
                <span className="lg:hidden">{c.short}</span>
                <span className="hidden lg:inline">{c.text}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 hidden w-full grid-cols-3 gap-5 lg:grid">
        {MINIS.map((m) => (
          <div
            key={m.title}
            className={`${m.tint} flex items-start gap-3.5 rounded-[20px] p-5 [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--pub-line)]`}
          >
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-[14px] ${m.ic}`}
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
                {m.icon}
              </svg>
            </span>
            <span className="leading-normal">
              <b className="text-base">{m.title}</b>
              <br />
              <span className="qv-auth-muted text-[13.5px] leading-normal font-semibold">
                {m.text}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingStories() {
  return (
    <section className={`${SECTION} hidden flex-col items-center gap-3.5 lg:flex`}>
      <span className="qv-pub-kicker">Stories</span>
      <h2 className={H2}>
        Different views, <span className="text-[var(--pub-blue)]">stronger together.</span>
      </h2>
      <p className={LEAD}>How people turn conversation into clear priorities.</p>
      <div className="grid w-full grid-cols-[1.12fr_1fr] items-start gap-6">
        <figure className="qv-pub-card m-0">
          <Image
            src="/assets/redesign/comic-parents.jpg"
            alt="Comic: three parents use Quote.Vote to agree on daycare priorities and present them together"
            width={1402}
            height={1122}
            sizes="(min-width: 1240px) 655px, 50vw"
            className="block h-auto w-full"
          />
          <figcaption className="px-[18px] py-3.5 text-sm font-bold">
            Parents. Together, we make daycare better.
          </figcaption>
        </figure>
        <figure className="qv-pub-card m-0">
          <Image
            src="/assets/redesign/comic-friday.jpg"
            alt="Comic: a frustrated reader finds Quote.Vote and helps turn ideas into a proposal the city council hears"
            width={1254}
            height={1254}
            sizes="(min-width: 1240px) 585px, 50vw"
            className="block h-auto w-full"
          />
          <figcaption className="px-[18px] py-3.5 text-sm font-bold">
            From shouting threads to a community proposal.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "Why is it invite-only?",
    a: "Each request is reviewed by an admin while the community grows, so conversations stay thoughtful from the start.",
    short: "An admin reviews each request while the community grows.",
  },
  {
    q: "Can I read without an account?",
    a: "Yes. Anyone can read public quotes and discussions. Voting, quoting and commenting are for members.",
    short: "Yes. Voting, quoting and commenting are for members.",
  },
  {
    q: "Is it free?",
    a: "Yes. Quote.Vote is non-profit and supported by donations. Nobody can pay to be seen.",
    short: "",
  },
  {
    q: "Is the code public?",
    a: "Yes. Quote.Vote is open source, and contributors can help build it on GitHub.",
    short: "",
  },
];

export function LandingFaq() {
  return (
    <section
      id="faq"
      className={`${SECTION} grid scroll-mt-20 grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-12`}
    >
      <div className="flex flex-col gap-3.5">
        <span className="qv-pub-kicker max-lg:hidden!">Questions</span>
        <h2 className="qv-auth-display m-0 text-[30px]! lg:text-[42px]!">Good to know</h2>
        <p className="qv-auth-muted m-0 hidden text-base leading-[1.6]! font-semibold lg:block">
          Still curious? Read our mission or get in touch.
        </p>
        <Link href="/about" className="qv-auth-btn qv-pub-btn-outline-blue w-fit max-lg:hidden!">
          Read Our Mission
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {FAQ.map((f) => (
          <div
            key={f.q}
            className={`qv-pub-card flex-col gap-2 px-[18px] py-4 lg:flex lg:rounded-[18px] lg:px-6 lg:py-[22px] ${f.short ? "flex" : "hidden"}`}
          >
            <h3 className="m-0 text-base! leading-normal! font-bold lg:text-[16.5px]!">{f.q}</h3>
            <p className="qv-auth-muted m-0 text-[13.5px] leading-[1.6]! lg:text-[14.5px]">
              <span className="lg:hidden">{f.short}</span>
              <span className="hidden lg:inline">{f.a}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const DONATE_URL = "https://opencollective.com/quotevote/donate";

export function LandingJoin() {
  return (
    <section className={`${SECTION} pb-14 lg:pb-24`}>
      {/* Phone: donate and newsletter in one card */}
      <div className="flex flex-col gap-3.5 rounded-[22px] border border-[var(--pub-join-line)] bg-[var(--pub-join-bg)] p-5 lg:hidden [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2">
        <h2 className="qv-auth-display m-0 text-[24px]!">
          Help keep Quote.Vote free for everyone.
        </h2>
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="qv-auth-btn qv-auth-btn-blue qv-auth-btn-lg"
        >
          Donate Today
        </a>
        <NewsletterForm id="newsletter-phone" variant="phone" />
      </div>
      {/* Desktop: three panels */}
      <div className="hidden grid-cols-[1.2fr_1fr_0.8fr] overflow-hidden rounded-[26px] border border-[var(--pub-join-line)] bg-[var(--pub-join-bg)] lg:grid [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:shadow-[var(--pub-panel-shadow)]">
        <div className="p-8">
          <h2 className="qv-auth-display m-0 text-[28px]!">
            Join us in creating a truly open and equal community.
          </h2>
          <p className="mt-3 mb-[18px] text-[14.5px] leading-[1.6]! text-[var(--ra-body)]">
            Quote.Vote is nonprofit, open source and donation-supported. Our only funding comes from
            people like you.
          </p>
          <Link href="/auths/request-access" className="qv-auth-btn qv-auth-btn-primary">
            Request Invite
          </Link>
        </div>
        <div className="border-l border-[var(--pub-join-line)] p-8">
          <h3 className="qv-auth-display m-0 text-[22px]!">Please be in touch!</h3>
          <p className="qv-auth-muted mt-2 mb-3.5 text-[13.5px] leading-[1.5]!">
            Sign up for our newsletter. We’ll send updates as we make progress.
          </p>
          <NewsletterForm id="newsletter" variant="desktop" />
        </div>
        <div className="flex flex-col gap-3 border-l border-[var(--pub-join-line)] bg-[var(--auth-surface)] p-8">
          <b className="text-[15px]">Help keep Quote.Vote free for everyone.</b>
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="qv-auth-btn qv-auth-btn-blue"
          >
            Donate Today
          </a>
          <Link href="/about" className="qv-auth-link text-[13px] font-bold">
            Learn more about donations →
          </Link>
        </div>
      </div>
    </section>
  );
}
