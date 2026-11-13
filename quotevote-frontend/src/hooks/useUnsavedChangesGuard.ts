"use client";

import { useEffect, useRef } from "react";

/** Where the member was trying to go when the guard stopped them. */
export type LeaveTarget = { kind: "href"; href: string } | { kind: "back" };

/**
 * Stops the member from losing unsaved work: warns on reload/close, and catches
 * in-app link clicks and the browser Back button while `active`, calling
 * `onAttempt` with where they were going. `allowLeave()` lets the next
 * navigation through (after Save or Discard).
 */
export function useUnsavedChangesGuard(
  active: boolean,
  onAttempt: (target: LeaveTarget) => void
): { allowLeave: () => void; goBack: () => void } {
  const leavingRef = useRef(false);
  const sentinelsRef = useRef(0);
  const onAttemptRef = useRef(onAttempt);
  useEffect(() => {
    onAttemptRef.current = onAttempt;
  }, [onAttempt]);

  useEffect(() => {
    if (!active) return;
    leavingRef.current = false;

    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (leavingRef.current) return;
      event.preventDefault();
    };

    const onClick = (event: MouseEvent): void => {
      if (leavingRef.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      event.preventDefault();
      event.stopPropagation();
      onAttemptRef.current({ kind: "href", href: `${url.pathname}${url.search}${url.hash}` });
    };

    // A sentinel entry lets Back be caught: Back pops it, and the guard puts it back.
    window.history.pushState({ avatarEditorGuard: true }, "", window.location.href);
    sentinelsRef.current += 1;
    const onPopState = (): void => {
      if (leavingRef.current) return;
      window.history.pushState({ avatarEditorGuard: true }, "", window.location.href);
      onAttemptRef.current({ kind: "back" });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [active]);

  return {
    allowLeave: () => {
      leavingRef.current = true;
    },
    /** Leaves to the page before the editor, skipping the guard's own history entries. */
    goBack: () => {
      leavingRef.current = true;
      window.history.go(-(sentinelsRef.current + 1));
    },
  };
}
