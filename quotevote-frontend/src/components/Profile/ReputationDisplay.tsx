"use client";

import type { ReputationDisplayProps } from "@/types/profile";

/* Reputation panel from the updated design (Profile): the score out of 1000 with its
   label and bar, the two part scores, and the figures behind them (updated design). */

const LEVELS = [
  {
    min: 800,
    label: "Excellent",
    tag: "qv-auth-tag-up",
    bar: "linear-gradient(90deg, #52b274, #16a06a)",
  },
  {
    min: 600,
    label: "Good",
    tag: "qv-auth-tag-amber",
    bar: "linear-gradient(90deg, #f6c343, #e89b12)",
  },
  {
    min: 400,
    label: "Fair",
    tag: "qv-auth-tag-amber",
    bar: "linear-gradient(90deg, #f6c343, #e5484d)",
  },
  {
    min: -Infinity,
    label: "Poor",
    tag: "qv-auth-tag-down",
    bar: "linear-gradient(90deg, #ff6060, #c42b2b)",
  },
];

/** GraphQL sends ISO strings; older payloads send epoch milliseconds as text. */
function formatDate(value: string | Date | null | undefined): string | null {
  if (value == null || value === "") return null;
  const date =
    value instanceof Date
      ? value
      : /^\d+$/.test(value.trim())
        ? new Date(Number(value))
        : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("en-US");
}

export function ReputationDisplay({
  reputation,
  onRefresh,
  loading = false,
}: ReputationDisplayProps) {
  if (!reputation) {
    return (
      <section className="qv-inv-panel p-5 font-redesign">
        <p className="m-0 text-sm text-[var(--shell-muted)]">No reputation data available</p>
      </section>
    );
  }

  const score = Math.round(reputation.overallScore);
  const level = LEVELS.find((l) => score >= l.min)!;
  const updated = formatDate(reputation.lastCalculated);
  const m = reputation.metrics ?? ({} as NonNullable<typeof reputation.metrics>);
  const parts = [
    { value: reputation.inviteNetworkScore, label: "Invite Network", tint: "qv-pub-tint-blue" },
    { value: reputation.activityScore, label: "Activity", tint: "qv-pub-tint-purple" },
  ];
  const figures: [string, number | undefined][] = [
    ["Invited", m.totalInvitesAccepted],
    ["Avg Invitee Rep", m.averageInviteeReputation],
    ["Posts Created", m.totalPosts],
    ["Comments Made", m.totalComments],
  ];

  return (
    <section
      data-testid="reputation-display"
      aria-labelledby="reputation-title"
      className="qv-auth qv-inv-panel flex flex-col gap-3.5 p-5 font-redesign"
    >
      <div className="flex items-center justify-between">
        <h2 id="reputation-title" className="m-0 text-[15px]! leading-normal! font-extrabold">
          Reputation
        </h2>
        {onRefresh && (
          <button
            type="button"
            className="qv-auth-icon-btn static! size-[34px]!"
            aria-label="Refresh reputation"
            onClick={() => onRefresh()}
            disabled={loading}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <b className="qv-auth-display text-[44px]!">{score}</b>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className={`qv-auth-tag ${level.tag}`}>{level.label}</span>
            <span className="qv-auth-hint">
              {updated ? `Updated ${updated}` : "Not updated yet"}
            </span>
          </div>
          <span className="qv-pub-bar" role="img" aria-label={`${score} of 1000`}>
            <span
              style={{ width: `${Math.max(0, Math.min(100, score / 10))}%`, background: level.bar }}
            />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {parts.map((p) => (
          <div
            key={p.label}
            className={`${p.tint} flex flex-col gap-1.5 rounded-[14px] p-3 [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2 [.neo-brutalism_&]:border-[var(--inv-panel-line)]`}
          >
            <b className="text-xl">{Math.round(p.value ?? 0)}</b>
            <span className="text-xs leading-tight font-bold text-[var(--auth-muted)]">
              {p.label}
            </span>
          </div>
        ))}
      </div>

      <dl className="m-0 grid grid-cols-2 gap-x-[18px]">
        {figures.map(([label, value], i) => (
          <div
            key={label}
            className={`flex justify-between py-2 text-[13.5px] ${i < figures.length - 2 ? "border-b border-[var(--inv-row-line)]" : ""}`}
          >
            <dt className="font-semibold text-[var(--auth-muted)]">{label}</dt>
            <dd className="m-0 font-bold">{Math.round(value ?? 0)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
