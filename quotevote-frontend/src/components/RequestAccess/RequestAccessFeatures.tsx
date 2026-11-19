import { Users } from "lucide-react";

/** Ballot box icon from the design: a box with a ballot going in. */
function BallotIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
    >
      <path d="M4 13h16v7H4z" />
      <path d="M9 13V5h6v8" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "Quote real sources",
    text: "Every post can carry its source and who said it.",
    tint: "bg-[var(--ra-tint-blue)]",
    icon: (
      <span
        className="qv-auth-ic bg-[var(--ra-ic-blue)] pt-2.5 font-[Georgia,serif] text-[26px] leading-none font-extrabold text-[var(--ra-ic-blue-ink)]"
        aria-hidden="true"
      >
        “
      </span>
    ),
  },
  {
    title: "Vote on specific statements",
    text: "Agree or disagree with the exact words, not the person.",
    tint: "bg-[var(--ra-tint-green)]",
    icon: (
      <span className="qv-auth-ic bg-[var(--ra-ic-green)] text-[var(--ra-ic-green-ink)]">
        <BallotIcon />
      </span>
    ),
  },
  {
    title: "Build common ground",
    text: "Different views. Shared future. No ads, no algorithms.",
    tint: "bg-[var(--ra-tint-yellow)]",
    icon: (
      <span className="qv-auth-ic bg-[var(--ra-ic-yellow)] text-[var(--ra-ic-yellow-ink)]">
        <Users size={22} aria-hidden="true" />
      </span>
    ),
  },
];

/** The three cards under the request access form. */
export function RequestAccessFeatures() {
  return (
    <section
      aria-label="What Quote.Vote is for"
      className="mx-auto grid max-w-[1240px] grid-cols-1 gap-5 px-4 sm:px-8 md:grid-cols-3 lg:px-0"
    >
      {FEATURES.map((feature) => (
        <div key={feature.title} className={`qv-auth-feat ${feature.tint}`}>
          {feature.icon}
          <h2 className="m-0 text-lg! leading-snug! font-bold tracking-normal!">{feature.title}</h2>
          <p className="qv-auth-muted m-0 text-[14.5px] leading-[1.55]!">{feature.text}</p>
        </div>
      ))}
    </section>
  );
}
