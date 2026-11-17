"use client";

import { useReducer, useState } from "react";
import { AVATAR_KEYS, SHUFFLE_GROUPS, SHUFFLE_POOL } from "@/lib/avatarOptions";
import type {
  AvatarDraft,
  AvatarEditorApi,
  AvatarEditorState,
  AvatarKey,
  ShuffleGroup,
} from "@/types/avatar";

const HISTORY_LIMIT = 50;

type Action =
  | { type: "set"; patch: Partial<AvatarDraft> }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" }
  | { type: "load"; draft: AvatarDraft }
  | { type: "saved"; draft: AvatarDraft };

function sameDraft(a: AvatarDraft, b: AvatarDraft): boolean {
  return AVATAR_KEYS.every((key) => a[key] === b[key]);
}

function commit(state: AvatarEditorState, next: AvatarDraft): AvatarEditorState {
  if (sameDraft(state.draft, next)) return state;
  return {
    ...state,
    draft: next,
    past: [...state.past, state.draft].slice(-HISTORY_LIMIT),
    future: [],
  };
}

export function avatarEditorReducer(state: AvatarEditorState, action: Action): AvatarEditorState {
  switch (action.type) {
    case "set":
      return commit(state, { ...state.draft, ...action.patch });
    case "undo": {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        ...state,
        draft: previous,
        past: state.past.slice(0, -1),
        future: [state.draft, ...state.future],
      };
    }
    case "redo": {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return { ...state, draft: next, past: [...state.past, state.draft], future: rest };
    }
    case "reset":
      return commit(state, state.saved);
    case "load":
      return { saved: action.draft, draft: action.draft, past: [], future: [] };
    case "saved":
      return { ...state, saved: action.draft, draft: action.draft };
    default:
      return state;
  }
}

/** Number of qualities that differ between two drafts. */
export function countChanges(a: AvatarDraft, b: AvatarDraft): number {
  return AVATAR_KEYS.filter((key) => a[key] !== b[key]).length;
}

/** A shuffled draft that keeps every key in a locked group. */
export function shuffleDraft(
  draft: AvatarDraft,
  locks: ShuffleGroup[],
  random: () => number = Math.random
): AvatarDraft {
  const locked = new Set<AvatarKey>(locks.flatMap((group) => SHUFFLE_GROUPS[group]));
  const next = { ...draft };
  for (const key of AVATAR_KEYS) {
    if (locked.has(key)) continue;
    const pool = SHUFFLE_POOL[key];
    next[key] = pool[Math.floor(random() * pool.length)] ?? draft[key];
  }
  return next;
}

/**
 * Draft/saved state for the avatar editor. `initial` is the saved avatar; call `load`
 * again (through `markSaved`) after a successful save.
 */
export function useAvatarEditor(initial: AvatarDraft): AvatarEditorApi & {
  load: (draft: AvatarDraft) => void;
} {
  const [state, dispatch] = useReducer(avatarEditorReducer, {
    saved: initial,
    draft: initial,
    past: [],
    future: [],
  });
  const [locks, setLocks] = useState<ShuffleGroup[]>(["Hair"]);
  const changeCount = countChanges(state.draft, state.saved);

  return {
    draft: state.draft,
    saved: state.saved,
    changeCount,
    isDirty: changeCount > 0,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    locks,
    set: (patch) => dispatch({ type: "set", patch }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
    reset: () => dispatch({ type: "reset" }),
    shuffle: () => dispatch({ type: "set", patch: shuffleDraft(state.draft, locks) }),
    toggleLock: (group) =>
      setLocks((current) =>
        current.includes(group) ? current.filter((g) => g !== group) : [...current, group]
      ),
    markSaved: (draft) => dispatch({ type: "saved", draft }),
    load: (draft) => dispatch({ type: "load", draft }),
  };
}
