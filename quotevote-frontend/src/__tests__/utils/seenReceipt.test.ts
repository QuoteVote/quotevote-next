/**
 * "Seen" for direct conversations: whether, and when, the other member read my latest message.
 */
import { seenLabel, seenReceipt } from "@/lib/utils/seenReceipt";
import type { ChatMessage } from "@/types/chat";

const message = (overrides: Partial<ChatMessage>): ChatMessage => ({
  _id: "m",
  messageRoomId: "room",
  userId: "me",
  created: "2026-11-20T10:00:00.000Z",
  ...overrides,
});

describe("seenReceipt", () => {
  it("is null without a signed-in member or a message of mine", () => {
    expect(seenReceipt([message({})], null)).toBeNull();
    expect(seenReceipt([message({ userId: "them" })], "me")).toBeNull();
  });

  it("uses my latest message, even when theirs came after", () => {
    const readAt = "2026-11-20T14:51:00.000Z";
    const receipt = seenReceipt(
      [
        message({
          _id: "old",
          readByDetailed: [{ userId: "them", readAt: "2026-11-19T09:00:00.000Z" }],
        }),
        message({ _id: "mine", readByDetailed: [{ userId: "them", readAt }] }),
        message({ _id: "theirs", userId: "them" }),
      ],
      "me"
    );
    expect(receipt?.readAt?.toISOString()).toBe(readAt);
  });

  it("is null while my latest message is unread", () => {
    expect(
      seenReceipt(
        [
          message({ _id: "old", readBy: ["them"] }),
          message({ _id: "new", readBy: [], readByDetailed: [] }),
        ],
        "me"
      )
    ).toBeNull();
  });

  it("skips my deleted messages", () => {
    const receipt = seenReceipt(
      [message({ _id: "kept", readBy: ["them"] }), message({ _id: "gone", deleted: true })],
      "me"
    );
    expect(receipt).toEqual({ readAt: null });
  });

  it("ignores my own and broken entries, and gives no time for reads before times were kept", () => {
    expect(
      seenReceipt(
        [
          message({
            readBy: ["me", "them"],
            readByDetailed: [
              { userId: "me", readAt: "2026-11-20T11:00:00.000Z" },
              null,
              { userId: "them", readAt: "nope" },
            ],
          }),
        ],
        "me"
      )
    ).toEqual({ readAt: null });
  });
});

describe("seenLabel", () => {
  it("shows the time today, and 'Seen' alone without one", () => {
    const today = new Date();
    today.setHours(14, 51, 0, 0);
    expect(seenLabel({ readAt: today })).toBe("Seen 2:51 PM");
    expect(seenLabel({ readAt: null })).toBe("Seen");
  });

  it("names yesterday and gives the date for older reads", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(9, 5, 0, 0);
    expect(seenLabel({ readAt: yesterday })).toBe("Seen yesterday at 9:05 AM");

    expect(seenLabel({ readAt: new Date(2026, 0, 5, 18, 30) })).toMatch(/^Seen Jan 5 at 6:30 PM$/);
  });
});
