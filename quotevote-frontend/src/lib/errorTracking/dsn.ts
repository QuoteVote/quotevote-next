import type { ParsedDsn } from "@/types/errorTracking";

/**
 * Reads a Sentry DSN (`https://<publicKey>@<host>/<projectId>`). Returns null for a blank or
 * malformed value, so a bad setting turns error tracking off instead of breaking the page.
 */
export function parseSentryDsn(dsn: string | undefined | null): ParsedDsn | null {
  const value = dsn?.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const projectId = url.pathname.replace(/^\/+|\/+$/g, "");
  if (!url.username || !/^\d+$/.test(projectId)) return null;

  return {
    protocol: url.protocol,
    host: url.host,
    projectId,
    publicKey: url.username,
  };
}

/** Whether two DSNs name the same project with the same key. */
export function isSameDsn(a: ParsedDsn, b: ParsedDsn): boolean {
  return (
    a.protocol === b.protocol &&
    a.host === b.host &&
    a.projectId === b.projectId &&
    a.publicKey === b.publicKey
  );
}

/** Sentry's envelope endpoint for a project. */
export function envelopeUrl(dsn: ParsedDsn): string {
  return `${dsn.protocol}//${dsn.host}/api/${dsn.projectId}/envelope/`;
}
