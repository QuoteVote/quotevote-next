/**
 * Live updates follow the session (#793).
 *
 * A WebSocket connection is signed in once, with the token it was opened with, and room
 * access is checked when each subscription starts. Without this, a connection kept
 * receiving events after the token expired, the member signed out, or the account was
 * disabled, until the socket happened to close.
 *
 * The guard closes the socket when the token expires and when the account stops being
 * usable. It uses 4403 (Forbidden), which the graphql-ws client retries: a member whose
 * sign-in was renewed reconnects with the new token and keeps their live updates, while a
 * signed-out session or a disabled account is refused when it subscribes again. 4401 would
 * stop the client from ever reconnecting, renewed sign-in or not.
 */
import * as jwt from 'jsonwebtoken';
import { logger } from '~/data/utils/logger';
import type { GuardedSocket, WatchSessionOptions } from '~/types/wsSession';

/** graphql-ws `CloseCode.Forbidden`: the client reconnects and sends its current token. */
export const SESSION_CLOSE_CODE = 4403;
export const SESSION_EXPIRED_REASON = 'Session expired';
export const ACCOUNT_UNAVAILABLE_REASON = 'Account unavailable';

/** How often an open connection's account is checked again. */
export const SESSION_CHECK_INTERVAL_MS = 60_000;

/** Node timers cap out near 24.8 days; a longer wait would fire at once. */
const MAX_TIMER_MS = 2_147_483_647;

/** When the token expires, in ms since the epoch, or null if it carries no `exp`. */
export function tokenExpiresAt(token: string): number | null {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || typeof decoded.exp !== 'number') return null;
  return decoded.exp * 1000;
}

const guarded = new WeakSet<GuardedSocket>();

/**
 * Watches one signed-in connection until it closes. Safe to call for every subscription on
 * the same socket: only the first call sets the guard up.
 */
export function watchSession(socket: GuardedSocket, options: WatchSessionOptions): void {
  if (guarded.has(socket)) return;
  guarded.add(socket);

  const now = options.now ?? Date.now;
  let closed = false;
  const close = (reason: string): void => {
    if (closed) return;
    closed = true;
    cleanUp();
    socket.close(SESSION_CLOSE_CODE, reason);
  };

  const expiresAt = tokenExpiresAt(options.token);
  const expiryTimer =
    expiresAt === null
      ? null
      : setTimeout(
          () => close(SESSION_EXPIRED_REASON),
          Math.min(Math.max(expiresAt - now(), 0), MAX_TIMER_MS)
        );

  const accountCheck = setInterval(() => {
    options
      .accountStillActive(options.userId)
      .then((active) => {
        if (!active) close(ACCOUNT_UNAVAILABLE_REASON);
      })
      .catch((error: unknown) => {
        // A failed lookup leaves the connection open; the next check tries again.
        logger.warn('Live update session check failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, options.checkIntervalMs ?? SESSION_CHECK_INTERVAL_MS);

  function cleanUp(): void {
    if (expiryTimer) clearTimeout(expiryTimer);
    clearInterval(accountCheck);
  }

  socket.once('close', () => {
    closed = true;
    cleanUp();
  });
}
