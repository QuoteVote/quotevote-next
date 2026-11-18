import {
  countRequests,
  countSentInvites,
  formatInviteDate,
  requestActions,
  requestStatus,
  sentInviteStatus,
} from "@/lib/utils/inviteStatus";
import type { InviteRequest, SentInvite } from "@/types/admin";

const request = (status: string, signedUp = false): InviteRequest => ({
  _id: status,
  email: `${status}@example.org`,
  joined: "2026-11-01",
  status,
  signedUp,
});

const sent = (status: string | null, expiresAt: string | null): SentInvite => ({
  _id: `${status}`,
  email: "friend@example.org",
  status,
  joined: "2026-11-01",
  expiresAt,
});

describe("inviteStatus", () => {
  it("reads the legacy request codes", () => {
    expect(requestStatus("1")).toBe("pending");
    expect(requestStatus("2")).toBe("declined");
    expect(requestStatus("4")).toBe("accepted");
    expect(requestStatus("9")).toBe("unknown");
  });

  it("offers actions by state, and none once signup is done", () => {
    expect(requestActions(request("1"))).toEqual(["accept", "decline"]);
    expect(requestActions(request("4"))).toEqual(["resend", "reset"]);
    expect(requestActions(request("4", true))).toEqual([]);
    expect(requestActions(request("2"))).toEqual(["reset"]);
    expect(requestActions(request("7"))).toEqual(["reset"]);
  });

  it("shows a pending sent invite whose link lapsed as expired", () => {
    const now = new Date("2026-11-19T00:00:00Z");
    expect(sentInviteStatus(sent("pending", "2026-11-20T00:00:00Z"), now)).toBe("pending");
    expect(sentInviteStatus(sent("pending", "2026-11-18T00:00:00Z"), now)).toBe("expired");
    expect(sentInviteStatus(sent("Accepted", null), now)).toBe("accepted");
    expect(sentInviteStatus(sent(null, null), now)).toBe("unknown");
  });

  it("counts pending, accepted and declined", () => {
    expect(
      countRequests([request("1"), request("1"), request("4", true), request("2"), request("9")])
    ).toEqual({
      pending: 2,
      accepted: 1,
      declined: 1,
    });
    const now = new Date("2026-11-19T00:00:00Z");
    expect(
      countSentInvites(
        [
          sent("pending", "2026-11-20T00:00:00Z"),
          sent("pending", "2026-11-01T00:00:00Z"),
          sent("declined", null),
        ],
        now
      )
    ).toEqual({ pending: 1, accepted: 0, declined: 1 });
  });

  it("formats dates as the design shows them", () => {
    expect(formatInviteDate("2026-11-11T12:00:00Z")).toBe("Nov 11, 2026");
    expect(formatInviteDate(String(Date.UTC(2026, 10, 8, 12)))).toBe("Nov 8, 2026");
    expect(formatInviteDate(null)).toBe("—");
  });
});
