/** Reading and completing stored avatars for the editor (#656). */
import {
  buildAvatarUrl,
  completeDraft,
  getDefaultAvatar,
  isValidDraft,
  readAvatarQualities,
} from "@/lib/avatar";
import { AVATAR_KEYS } from "@/lib/avatarOptions";

describe("buildAvatarUrl", () => {
  it("uses the Circle style by default and Transparent when asked", () => {
    expect(buildAvatarUrl({ topType: "Hat" })).toContain("avatarStyle=Circle");
    expect(buildAvatarUrl({ topType: "Hat" }, "Transparent")).toContain("avatarStyle=Transparent");
  });
});

describe("readAvatarQualities", () => {
  it("reads an object and a JSON string, keeping only known keys and values", () => {
    const stored = { topType: "LongHairDreads", eyeType: "Lasers", url: "https://x.test/a.png" };
    expect(readAvatarQualities(stored)).toEqual({ topType: "LongHairDreads" });
    expect(readAvatarQualities(JSON.stringify(stored))).toEqual({ topType: "LongHairDreads" });
  });

  it("returns null for image URLs, empty values and arrays", () => {
    expect(readAvatarQualities("https://example.com/me.png")).toBeNull();
    expect(readAvatarQualities(null)).toBeNull();
    expect(readAvatarQualities(undefined)).toBeNull();
    expect(readAvatarQualities("[]")).toBeNull();
    expect(readAvatarQualities({ nothing: "here" })).toBeNull();
  });
});

describe("completeDraft", () => {
  it("fills every key, keeping stored values over the member's default", () => {
    const draft = completeDraft({ topType: "Hijab" }, "maya");
    expect(Object.keys(draft).sort()).toEqual([...AVATAR_KEYS].sort());
    expect(draft.topType).toBe("Hijab");
    expect(draft.skinColor).toBe(getDefaultAvatar("maya").skinColor);
    expect(isValidDraft(draft)).toBe(true);
  });

  it("uses the same default avatar the rest of the app shows for a member with none", () => {
    const draft = completeDraft(null, "maya");
    const defaults = getDefaultAvatar("maya");
    Object.entries(defaults).forEach(([key, value]) => {
      expect(draft[key as keyof typeof draft]).toBe(value);
    });
  });
});

describe("isValidDraft", () => {
  it("rejects missing keys and unknown values", () => {
    const draft = completeDraft(null, "maya");
    expect(isValidDraft({ ...draft, topType: "Nope" })).toBe(false);
    const { topType: _omit, ...missing } = draft;
    void _omit;
    expect(isValidDraft(missing)).toBe(false);
  });
});
