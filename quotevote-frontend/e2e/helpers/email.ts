/**
 * Mailosaur helpers for #498 transactional email E2E.
 *
 * Set E2E_EMAIL_RECIPIENT to a Mailosaur address (you@SERVER_ID.mailosaur.net)
 * so SendGrid delivers somewhere Playwright can read via the Mailosaur API.
 */
import MailosaurClient from 'mailosaur';
import type { Message } from 'mailosaur/lib/models';

const DEFAULT_WAIT_MS = 60_000;

export function getEmailRecipient(): string {
  return (process.env.E2E_EMAIL_RECIPIENT ?? '').trim().toLowerCase();
}

export function getMailosaurServerId(): string {
  return (process.env.MAILOSAUR_SERVER_ID ?? '').trim();
}

export function getMailosaurApiKey(): string {
  return (process.env.MAILOSAUR_API_KEY ?? '').trim();
}

/** True when recipient + Mailosaur credentials are present. */
export function hasEmailE2ECredentials(): boolean {
  return Boolean(getEmailRecipient() && getMailosaurApiKey() && getMailosaurServerId());
}

export function uniqueMailosaurRecipient(prefix: string): string {
  const serverId = getMailosaurServerId();
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${stamp}@${serverId}.mailosaur.net`.toLowerCase();
}

function client(): MailosaurClient {
  const apiKey = getMailosaurApiKey();
  if (!apiKey) {
    throw new Error('MAILOSAUR_API_KEY is required for email E2E');
  }
  return new MailosaurClient(apiKey);
}

export interface WaitForEmailOptions {
  sentTo: string;
  /** Only accept messages received at/after this time (ms since epoch). */
  receivedAfter: Date;
  timeoutMs?: number;
  subjectContains?: string;
}

/** Poll Mailosaur until a matching message arrives. */
export async function waitForEmail(options: WaitForEmailOptions): Promise<Message> {
  const serverId = getMailosaurServerId();
  if (!serverId) {
    throw new Error('MAILOSAUR_SERVER_ID is required for email E2E');
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_WAIT_MS;
  const message = await client().messages.get(
    serverId,
    {
      sentTo: options.sentTo,
      ...(options.subjectContains ? { subject: options.subjectContains } : {}),
    },
    {
      timeout: timeoutMs,
      receivedAfter: options.receivedAfter,
    }
  );

  return message;
}

/**
 * Prefer password-reset / invite-signup app links from the message body.
 * Does not assert legacy `/auth/*` redirects (covered elsewhere).
 */
export function extractAppLink(message: Message): string {
  const candidates = [
    ...(message.html?.links ?? []).map((l) => l.href ?? ''),
    ...(message.text?.links ?? []).map((l) => l.href ?? ''),
  ].filter(Boolean);

  const preferred = candidates.find(
    (href) =>
      href.includes('/auths/password-reset') ||
      href.includes('/auths/signup') ||
      href.includes('/auth/password-reset') ||
      href.includes('/auth/signup') ||
      href.includes('change_password') ||
      href.includes('create_password')
  );

  const href = preferred ?? candidates[0];
  if (!href) {
    throw new Error('Email contained no clickable links');
  }
  return href;
}
