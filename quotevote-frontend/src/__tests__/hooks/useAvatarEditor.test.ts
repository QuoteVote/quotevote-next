/** Avatar editor state (#656): undo/redo, reset, change count and shuffle locks. */
import { act, renderHook } from "@testing-library/react";
import {
  avatarEditorReducer,
  countChanges,
  shuffleDraft,
  useAvatarEditor,
} from "@/hooks/useAvatarEditor";
import { completeDraft } from "@/lib/avatar";
import { SHUFFLE_GROUPS } from "@/lib/avatarOptions";
import type { AvatarEditorState } from "@/types/avatar";

const saved = completeDraft(
  { topType: "LongHairBun", eyeType: "Default", clotheType: "ShirtCrewNeck", skinColor: "Brown" },
  "maya"
);

describe("avatarEditorReducer", () => {
  const start: AvatarEditorState = { saved, draft: saved, past: [], future: [] };

  it("records changes, undoes and redoes them", () => {
    let s = avatarEditorReducer(start, { type: "set", patch: { topType: "LongHairDreads" } });
    s = avatarEditorReducer(s, { type: "set", patch: { eyeType: "Happy" } });
    expect(s.past).toHaveLength(2);
    s = avatarEditorReducer(s, { type: "undo" });
    expect(s.draft.eyeType).toBe("Default");
    expect(s.draft.topType).toBe("LongHairDreads");
    s = avatarEditorReducer(s, { type: "redo" });
    expect(s.draft.eyeType).toBe("Happy");
    expect(s.future).toHaveLength(0);
  });

  it("ignores a change to the same value and clears redo on a new change", () => {
    const same = avatarEditorReducer(start, { type: "set", patch: { topType: saved.topType } });
    expect(same).toBe(start);
    let s = avatarEditorReducer(start, { type: "set", patch: { topType: "Hijab" } });
    s = avatarEditorReducer(s, { type: "undo" });
    s = avatarEditorReducer(s, { type: "set", patch: { eyeType: "Wink" } });
    expect(s.future).toHaveLength(0);
  });

  it("resets to saved as an undoable step, and saving moves the baseline", () => {
    let s = avatarEditorReducer(start, { type: "set", patch: { topType: "Hijab" } });
    s = avatarEditorReducer(s, { type: "reset" });
    expect(s.draft).toEqual(saved);
    s = avatarEditorReducer(s, { type: "undo" });
    expect(s.draft.topType).toBe("Hijab");
    s = avatarEditorReducer(s, { type: "saved", draft: s.draft });
    expect(countChanges(s.draft, s.saved)).toBe(0);
  });
});

describe("shuffleDraft", () => {
  it("keeps every key in a locked group", () => {
    const next = shuffleDraft(saved, ["Hair", "Colors"], () => 0.99);
    [...SHUFFLE_GROUPS.Hair, ...SHUFFLE_GROUPS.Colors].forEach((key) => {
      expect(next[key]).toBe(saved[key]);
    });
    expect(next.clotheType).not.toBe(saved.clotheType);
  });

  it("changes nothing when everything is locked", () => {
    expect(shuffleDraft(saved, ["Hair", "Face", "Clothing", "Colors"])).toEqual(saved);
  });
});

describe("useAvatarEditor", () => {
  it("tracks dirty state, change count and the Hair lock by default", () => {
    const { result } = renderHook(() => useAvatarEditor(saved));
    expect(result.current.isDirty).toBe(false);
    expect(result.current.locks).toEqual(["Hair"]);
    act(() => result.current.set({ topType: "LongHairDreads", eyeType: "Happy" }));
    expect(result.current.changeCount).toBe(2);
    expect(result.current.canUndo).toBe(true);
    act(() => result.current.toggleLock("Hair"));
    expect(result.current.locks).toEqual([]);
    act(() => result.current.reset());
    expect(result.current.isDirty).toBe(false);
  });
});
