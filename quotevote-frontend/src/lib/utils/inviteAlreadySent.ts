/** Shown when someone asks for access but an invite to their address is still open (#691). */
export const INVITE_ALREADY_SENT_MESSAGE =
  "An invite was already sent to this email. Check your inbox for the signup link.";

/**
 * True when `requestUserAccess` refused because an invite to the address is still
 * open. The API sends the same sentence, so the error message carries it.
 */
export function isInviteAlreadySentError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("An invite was already sent");
}
