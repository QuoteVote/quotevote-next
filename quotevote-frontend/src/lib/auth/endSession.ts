/**
 * Ends a session that could not be renewed (#804): signs the member out on this device,
 * tells them why, and opens the sign-in dialog over the page they are on, so signing in
 * again returns them right there.
 */

import { toast } from "sonner";
import { getToken, removeToken } from "@/lib/auth";
import { triggerAuthGate } from "@/lib/auth-gate";
import { useAppStore } from "@/store/useAppStore";

export const SESSION_ENDED_MESSAGE = "Your session has ended. Please sign in again.";

/** Ends the session once; later calls while signed out do nothing. */
export function endSession(): void {
  if (typeof window === "undefined") return;
  const state = useAppStore.getState();
  const wasSignedIn = Boolean(getToken() || state.user.data._id || state.user.data.id);
  removeToken();
  state.logout();
  if (!wasSignedIn) return;
  toast.info(SESSION_ENDED_MESSAGE, { id: "session-ended" });
  triggerAuthGate({ view: "login" });
}
