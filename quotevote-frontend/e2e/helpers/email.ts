/**
 * Local SendGrid mock helpers for #498 transactional email E2E.
 *
 * Backend must run with SENDGRID_MOCK_BASE_URL pointing at
 * `pnpm sendgrid:mock` (quotevote-backend). Playwright polls the same host.
 */
const DEFAULT_WAIT_MS = 30_000;
const POLL_INTERVAL_MS = 250;

export interface MockedEmail {
  id: string;
  receivedAt: string;
  to: string[];
  from?: string;
  subject?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  html?: string;
  text?: string;
}

export function getSendGridMockUrl(): string {
  return (
    process.env.E2E_SENDGRID_MOCK_URL?.trim() ||
    process.env.SENDGRID_MOCK_BASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
}

export function getEmailRecipient(): string {
  return (process.env.E2E_EMAIL_RECIPIENT ?? "").trim().toLowerCase();
}

/** True when the local SendGrid mock URL is configured for email E2E. */
export function hasEmailE2ECredentials(): boolean {
  return Boolean(getSendGridMockUrl());
}

/** Unique recipient for invite flows (does not need a real mailbox). */
export function uniqueE2ERecipient(prefix: string): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${stamp}@e2e.local`.toLowerCase();
}

export interface WaitForEmailOptions {
  sentTo: string;
  /** Only accept messages received at/after this time. */
  receivedAfter: Date;
  timeoutMs?: number;
}

async function fetchMatchingEmails(options: WaitForEmailOptions): Promise<MockedEmail[]> {
  const baseUrl = getSendGridMockUrl();
  if (!baseUrl) {
    throw new Error("E2E_SENDGRID_MOCK_URL (or SENDGRID_MOCK_BASE_URL) is required");
  }

  const url = new URL(`${baseUrl}/emails`);
  url.searchParams.set("to", options.sentTo.toLowerCase());
  url.searchParams.set("after", options.receivedAfter.toISOString());

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`SendGrid mock /emails failed: ${response.status}`);
  }

  const data = (await response.json()) as { messages?: MockedEmail[] };
  return data.messages ?? [];
}

/** Poll the local SendGrid mock until a matching message arrives. */
export async function waitForEmail(options: WaitForEmailOptions): Promise<MockedEmail> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_WAIT_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const messages = await fetchMatchingEmails(options);
    if (messages.length > 0) {
      return messages[messages.length - 1];
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for email to ${options.sentTo} via SendGrid mock`
  );
}

function collectLinkCandidates(message: MockedEmail): string[] {
  const fromData: string[] = [];
  const data = message.dynamicTemplateData ?? {};
  for (const key of ["change_password_url", "create_password_url", "resetLink"] as const) {
    const value = data[key];
    if (typeof value === "string" && value.length > 0) {
      fromData.push(value);
    }
  }

  const hrefRegex = /href=["']([^"']+)["']/gi;
  const fromHtml: string[] = [];
  if (message.html) {
    let match: RegExpExecArray | null;
    while ((match = hrefRegex.exec(message.html)) !== null) {
      fromHtml.push(match[1]);
    }
  }

  const fromText: string[] = [];
  if (message.text) {
    const urlRegex = /https?:\/\/\S+/g;
    const matches = message.text.match(urlRegex) ?? [];
    fromText.push(...matches.map((u) => u.replace(/[.,);]+$/, "")));
  }

  return [...fromData, ...fromHtml, ...fromText].filter(Boolean);
}

/**
 * Prefer password-reset / invite-signup app links from template data or body.
 * Throws (listing candidates) when none match — no silent fallback to logos.
 */
export function extractAppLink(message: MockedEmail): string {
  const candidates = collectLinkCandidates(message);

  const preferred = candidates.find(
    (href) =>
      href.includes("/auths/password-reset") ||
      href.includes("/auths/signup") ||
      href.includes("/auth/password-reset") ||
      href.includes("/auth/signup") ||
      href.includes("change_password") ||
      href.includes("create_password")
  );

  if (!preferred) {
    throw new Error(`Email contained no signup or reset link: ${candidates.join(", ") || "none"}`);
  }
  return preferred;
}
