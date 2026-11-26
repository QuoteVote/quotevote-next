/** The parts of a WebSocket the session guard uses: closing it, and hearing that it closed. */
export interface GuardedSocket {
  close(code?: number, reason?: string): void;
  once(event: 'close', listener: () => void): unknown;
}

/** Looks up whether an account can still use live updates (it exists and isn't disabled). */
export type AccountStillActive = (userId: string) => Promise<boolean>;

export interface WatchSessionOptions {
  /** The sign-in token the connection was opened with. */
  token: string;
  userId: string;
  accountStillActive: AccountStillActive;
  /** How often the account is checked again. Defaults to `SESSION_CHECK_INTERVAL_MS`. */
  checkIntervalMs?: number;
  now?: () => number;
}
