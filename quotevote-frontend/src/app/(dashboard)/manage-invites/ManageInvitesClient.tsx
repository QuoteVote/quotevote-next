"use client";

import { useState, useSyncExternalStore } from "react";
import { useQuery } from "@apollo/client/react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteStatusTag } from "@/components/Invites/InviteStatusTag";
import { InviteRequestActions } from "@/components/Invites/InviteRequestActions";
import { InviteEmptyState } from "@/components/Invites/InviteEmptyState";
import { USER_INVITE_REQUESTS, USER_SENT_INVITES } from "@/graphql/queries";
import { useAppStore } from "@/store/useAppStore";
import {
  countRequests,
  countSentInvites,
  formatInviteDate,
  requestStatus,
  sentInviteStatus,
} from "@/lib/utils/inviteStatus";
import type {
  InviteOverviewProps,
  ReceivedInvitesTableProps,
  SentInvitesResponse,
  SentInvitesTableProps,
  UserInviteRequestsResponse,
} from "@/types/admin";
import type { SettingsUserData } from "@/types/settings";

type TabId = "received" | "sent";

const ADMIN_STEPS = [
  "Accept a request to send a single-use signup link.",
  "Resend if the person can’t find the email.",
  "Reset a request to make a new decision.",
];

const MEMBER_STEPS = [
  "Invite someone from the Invite someone card on the home page.",
  "They get a single-use link to create their account.",
  "A link that isn’t used within 7 days expires.",
];

function ReceivedTable({ invites, onRefresh }: ReceivedInvitesTableProps) {
  if (invites.length === 0) {
    return <InviteEmptyState title="No invite requests" text="New requests will show up here." />;
  }
  return (
    <section className="qv-inv-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="qv-inv-table min-w-[620px]">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Joined</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-right!">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite._id}>
                <td className="font-bold [overflow-wrap:anywhere]">{invite.email}</td>
                <td className="qv-auth-muted whitespace-nowrap">
                  {formatInviteDate(invite.joined)}
                </td>
                <td>
                  <InviteStatusTag status={requestStatus(invite.status)} />
                </td>
                <td className="text-right">
                  <InviteRequestActions invite={invite} onComplete={onRefresh} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SentTable({ invites }: SentInvitesTableProps) {
  if (invites.length === 0) {
    return (
      <InviteEmptyState title="No invites sent yet" text="Invites you send will show up here." />
    );
  }
  return (
    <section className="qv-inv-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="qv-inv-table min-w-[520px]">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Sent</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite._id}>
                <td className="font-bold [overflow-wrap:anywhere]">{invite.email}</td>
                <td className="qv-auth-muted whitespace-nowrap">
                  {formatInviteDate(invite.joined)}
                </td>
                <td>
                  <InviteStatusTag status={sentInviteStatus(invite)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Overview({ counts, steps }: InviteOverviewProps) {
  const rows = [
    { label: "Pending", value: counts.pending, light: "#e3a008", tint: "var(--inv-sum-pending)" },
    {
      label: "Accepted",
      value: counts.accepted,
      light: "#52b274",
      tint: "var(--inv-sum-accepted)",
    },
    {
      label: "Declined",
      value: counts.declined,
      light: "#ff6060",
      tint: "var(--inv-sum-declined)",
    },
  ];
  return (
    <aside aria-label="Invite summary" className="flex flex-col gap-4 lg:pt-9">
      <section className="qv-inv-panel p-[18px]">
        <h2 className="qv-inv-sec-title">Overview</h2>
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.label} className="qv-inv-sum" style={{ background: row.tint }}>
              <span className="flex items-center gap-2 text-sm font-bold">
                <span
                  className="qv-inv-dot"
                  style={{ ["--light" as string]: row.light }}
                  aria-hidden="true"
                />
                {row.label}
              </span>
              <b className="text-2xl font-extrabold">{row.value}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="qv-inv-panel p-[18px]">
        <h2 className="qv-inv-sec-title">How it works</h2>
        <ol className="m-0 flex list-none flex-col gap-3 p-0 text-[13.5px] leading-[1.5] font-semibold text-[var(--auth-ink-2)]">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-2.5">
              <span className="qv-inv-step" aria-hidden="true">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}

const subscribeNoop = () => () => {};

export default function ManageInvitesClient() {
  // The signed-in user comes from browser storage, so the server can't know who is
  // viewing. Decide admin or member only once the page runs in the browser.
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const storedUser = useAppStore((s) => s.user.data) as SettingsUserData | undefined;
  const userData = isClient ? storedUser : undefined;
  const isAdmin = Boolean(userData?.admin);
  const userId = userData?._id || userData?.id || "";
  // Admins start on Received Requests, members only have Sent Invites.
  const [tab, setTab] = useState<TabId | null>(null);
  const activeTab: TabId = isAdmin ? (tab ?? "received") : "sent";

  const received = useQuery<UserInviteRequestsResponse>(USER_INVITE_REQUESTS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !isAdmin,
  });
  const sent = useQuery<SentInvitesResponse>(USER_SENT_INVITES, {
    variables: { userId },
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    skip: !userId,
  });

  const requests = received.data?.userInviteRequests ?? [];
  const sentInvites = sent.data?.getUserInvites ?? [];
  const current = activeTab === "received" ? received : sent;
  const counts = activeTab === "received" ? countRequests(requests) : countSentInvites(sentInvites);

  const tabs: { id: TabId; label: string; count: number }[] = [
    ...(isAdmin
      ? [{ id: "received" as const, label: "Received Requests", count: requests.length }]
      : []),
    { id: "sent", label: "Sent Invites", count: sentInvites.length },
  ];

  return (
    <div className="qv-auth -mx-4 min-h-[calc(100vh-var(--app-header-h))] bg-[var(--inv-ground)] px-4 pb-12">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="flex min-w-0 flex-col gap-[18px] pt-9">
          <h1 className="qv-auth-display m-0 text-[30px]! sm:text-[38px]!">Manage Invites</h1>
          <div className="qv-inv-tabs" role="tablist" aria-label="Invites">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`invites-tab-${t.id}`}
                aria-selected={activeTab === t.id}
                aria-controls={`invites-panel-${t.id}`}
                tabIndex={activeTab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => {
                  if (tabs.length > 1 && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
                    const next = tabs[(tabs.findIndex((x) => x.id === t.id) + 1) % tabs.length];
                    setTab(next.id);
                    document.getElementById(`invites-tab-${next.id}`)?.focus();
                  }
                }}
              >
                {t.label}
                <span className="qv-inv-count">{t.count}</span>
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`invites-panel-${activeTab}`}
            aria-labelledby={`invites-tab-${activeTab}`}
          >
            {!isClient ? (
              <div className="qv-inv-panel p-5" aria-busy="true">
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : current.error && !current.data ? (
              <p role="alert" className="qv-inv-panel qv-auth-err m-0 p-5 text-sm!">
                Couldn’t load invites: {current.error.message}
              </p>
            ) : current.loading && !current.data ? (
              <div className="qv-inv-panel p-5" aria-busy="true">
                <span className="sr-only">
                  <Loader2 aria-hidden="true" /> Loading invites
                </span>
                <Skeleton className="h-[200px] w-full" />
              </div>
            ) : activeTab === "received" ? (
              <ReceivedTable
                invites={requests}
                onRefresh={async () => {
                  await received.refetch();
                }}
              />
            ) : (
              <SentTable invites={sentInvites} />
            )}
          </div>
        </main>
        <Overview counts={counts} steps={activeTab === "received" ? ADMIN_STEPS : MEMBER_STEPS} />
      </div>
    </div>
  );
}
