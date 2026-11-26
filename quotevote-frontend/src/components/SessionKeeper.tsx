"use client";

import { useEffect } from "react";
import { endSession } from "@/lib/auth/endSession";
import { startSessionRenewal } from "@/lib/auth/session";

/** Renews the signed-in member's session in the background while the app is open (#804). */
export function SessionKeeper(): null {
  useEffect(() => startSessionRenewal(endSession), []);
  return null;
}
