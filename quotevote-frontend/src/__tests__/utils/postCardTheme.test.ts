import {
  STANDARD_POST_CARD_THEME,
  isPostedActivityType,
} from "@/lib/constants/postCardTheme";

describe("postCardTheme", () => {
  it("exposes the shared blue chrome used by feed and profile POSTED cards", () => {
    expect(STANDARD_POST_CARD_THEME.borderColor).toBe("#56b3ff");
  });

  it("recognizes POSTED activity aliases", () => {
    expect(isPostedActivityType("POSTED")).toBe(true);
    expect(isPostedActivityType("posted")).toBe(true);
    expect(isPostedActivityType("POST")).toBe(true);
    expect(isPostedActivityType("UPVOTED")).toBe(false);
    expect(isPostedActivityType("")).toBe(false);
    expect(isPostedActivityType(undefined)).toBe(false);
  });
});
