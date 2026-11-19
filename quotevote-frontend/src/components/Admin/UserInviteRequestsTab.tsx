"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { InviteStatusTag } from "@/components/Invites/InviteStatusTag";
import { InviteRequestActions } from "@/components/Invites/InviteRequestActions";
import { InviteEmptyState } from "@/components/Invites/InviteEmptyState";
import { parseApiDate } from "@/lib/utils/apiDate";
import { countRequests, formatInviteDate, requestStatus } from "@/lib/utils/inviteStatus";
import type {
  InviteRequest,
  InviteSortKey,
  InviteSortState,
  UserInviteRequestsTabProps,
} from "@/types/admin";

const PAGE_SIZE = 10;
const STATUS_ORDER: Record<string, number> = { pending: 0, accepted: 1, declined: 2, unknown: 3 };

function compare(a: InviteRequest, b: InviteRequest, key: InviteSortKey): number {
  if (key === "email") return a.email.localeCompare(b.email);
  if (key === "joined") {
    return (parseApiDate(a.joined)?.getTime() ?? 0) - (parseApiDate(b.joined)?.getTime() ?? 0);
  }
  return STATUS_ORDER[requestStatus(a.status)] - STATUS_ORDER[requestStatus(b.status)];
}

const COLUMNS: { key: InviteSortKey; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "joined", label: "Joined" },
  { key: "status", label: "Status" },
];

/** The control panel's Invites tab: counts, search, a sortable table and paging. */
export default function UserInviteRequestsTab({ data, onRefresh }: UserInviteRequestsTabProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<InviteSortState>({ key: "email", ascending: true });
  const [page, setPage] = useState(0);
  const counts = countRequests(data);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle ? data.filter((i) => i.email.toLowerCase().includes(needle)) : data;
    const sorted = [...filtered].sort((a, b) => compare(a, b, sort.key));
    return sort.ascending ? sorted : sorted.reverse();
  }, [data, query, sort]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * PAGE_SIZE;
  const visible = rows.slice(start, start + PAGE_SIZE);
  const shownTo = start + visible.length;

  const toggleSort = (key: InviteSortKey) => {
    setSort((s) => (s.key === key ? { key, ascending: !s.ascending } : { key, ascending: true }));
    setPage(0);
  };

  return (
    <div className="qv-auth flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="qv-auth-muted m-0 text-[13px] leading-normal!">
            Admin › <b className="text-[var(--auth-ink)]">Invites</b>
          </p>
          <h1 className="qv-auth-display mt-1 mb-0 text-[32px]! sm:text-[40px]!">
            Invitation Requests
          </h1>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Request counts">
          <span className="qv-inv-cnt-chip">
            <span
              className="qv-inv-dot"
              style={{ ["--light" as string]: "#e3a008" }}
              aria-hidden="true"
            />
            Pending {counts.pending}
          </span>
          <span className="qv-inv-cnt-chip">
            <span
              className="qv-inv-dot"
              style={{ ["--light" as string]: "#52b274" }}
              aria-hidden="true"
            />
            Accepted {counts.accepted}
          </span>
          <span className="qv-inv-cnt-chip">
            <span
              className="qv-inv-dot"
              style={{ ["--light" as string]: "#ff6060" }}
              aria-hidden="true"
            />
            Declined {counts.declined}
          </span>
        </div>
      </div>

      <div className="qv-inv-search w-full max-w-[408px]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 text-[var(--auth-muted)]"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <label htmlFor="invite-search" className="sr-only">
          Search by email
        </label>
        <input
          id="invite-search"
          type="search"
          placeholder="Search by email..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
      </div>

      {data.length === 0 ? (
        <InviteEmptyState title="No invite requests" text="New requests will show up here." />
      ) : (
        <section className="qv-inv-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="qv-inv-table min-w-[640px]">
              <thead>
                <tr>
                  {COLUMNS.map((col) => {
                    const active = sort.key === col.key;
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={active ? (sort.ascending ? "ascending" : "descending") : "none"}
                      >
                        <button
                          type="button"
                          className="qv-inv-sort"
                          onClick={() => toggleSort(col.key)}
                        >
                          {col.label}
                          {active && <span aria-hidden="true">{sort.ascending ? "↑" : "↓"}</span>}
                        </button>
                      </th>
                    );
                  })}
                  <th scope="col" className="text-right!">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="qv-auth-muted text-center font-semibold">
                      No requests match “{query.trim()}”.
                    </td>
                  </tr>
                ) : (
                  visible.map((invite) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
          <nav className="qv-inv-pager" aria-label="Invitation pages">
            <span className="flex min-w-[170px] flex-col gap-[7px] text-[13px] font-semibold text-[var(--auth-muted)]">
              <span>
                Showing{" "}
                <b className="text-[var(--auth-ink)]">
                  {rows.length === 0 ? 0 : start + 1}–{shownTo}
                </b>{" "}
                of {rows.length}
              </span>
              <span className="qv-inv-track" aria-hidden="true">
                <span
                  style={{
                    width: `${rows.length ? Math.max(2, (shownTo / rows.length) * 100) : 0}%`,
                  }}
                />
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="qv-auth-btn h-10! rounded-[12px]"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                className="qv-auth-btn h-10! rounded-[12px]"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        </section>
      )}
    </div>
  );
}
