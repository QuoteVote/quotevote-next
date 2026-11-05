import { conversationMatches, hasSearchTerms, tagToken } from "@/lib/utils/conversationSearch";
import { parseSearchQuery } from "@/utils/parseSearchQuery";
import type { ChatRoom, ConversationSearchContext } from "@/types/chat";

const room: ChatRoom = {
  _id: "r1",
  messageType: "POST",
  title: "Rent caps and new construction",
  created: "2026-10-19T00:00:00.000Z",
  postDetails: {
    _id: "p1",
    title: "Rent caps and new construction",
    text: "Do caps slow building?",
  },
};

const context: ConversationSearchContext = {
  messages: ["Vacancy data from the 2025 survey would help here."],
  people: [{ username: "alice", name: "Alice Local" }],
  tag: { tagId: "g1", title: "Local Housing" },
};

const matches = (q: string, ctx: ConversationSearchContext = context) =>
  conversationMatches(room, parseSearchQuery(q), ctx);

describe("conversationSearch (#531)", () => {
  it("matches words in the title, post and messages, in any case", () => {
    expect(matches("rent")).toBe(true);
    expect(matches("SLOW building")).toBe(true);
    expect(matches("vacancy survey")).toBe(true);
    expect(matches("vacancy parking")).toBe(false);
  });

  it("matches @ by username or any word of the name", () => {
    expect(matches("@ali")).toBe(true);
    expect(matches("@local")).toBe(true);
    expect(matches("@bob")).toBe(false);
  });

  it("matches # against the start of the tag, ignoring spaces", () => {
    expect(matches("#local")).toBe(true);
    expect(matches("#localhousing")).toBe(true);
    expect(matches("#housing")).toBe(false);
    expect(matches("#local", { ...context, tag: null })).toBe(false);
  });

  it("needs every term to match", () => {
    expect(matches("#local @alice vacancy")).toBe(true);
    expect(matches("#local @bob")).toBe(false);
  });

  it("turns a tag title into a search token", () => {
    expect(tagToken("Local Housing")).toBe("LocalHousing");
    expect(tagToken("Q&A")).toBe("QA");
  });

  it("does not treat a lone @ or # as a search", () => {
    expect(hasSearchTerms(parseSearchQuery("@"))).toBe(false);
    expect(hasSearchTerms(parseSearchQuery(" # "))).toBe(false);
    expect(hasSearchTerms(parseSearchQuery("#a"))).toBe(true);
  });
});
