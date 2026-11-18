import { envelopeUrl, isSameDsn, parseSentryDsn } from "@/lib/errorTracking/dsn";

/**
 * Forwards error reports from the browser to Sentry (#183). Used by `app/monitoring/route.ts`.
 *
 * The browser posts to this same-origin route, so the content security policy doesn't need
 * another host, and Sentry sees this server's address instead of the visitor's. It only
 * forwards envelopes addressed to the project in NEXT_PUBLIC_SENTRY_DSN, so it can't be used
 * to send anything anywhere else, and it is off when that setting is missing.
 */

/** Error reports are a few kilobytes. Anything far larger isn't one. */
export const MAX_ENVELOPE_BYTES = 256 * 1024;

const NEWLINE = 0x0a;

function readEnvelopeDsn(body: Uint8Array): string | null {
  const end = body.indexOf(NEWLINE);
  const headerBytes = end === -1 ? body : body.subarray(0, end);
  try {
    const header: unknown = JSON.parse(new TextDecoder().decode(headerBytes));
    if (typeof header === "object" && header !== null && "dsn" in header) {
      const { dsn } = header as { dsn: unknown };
      return typeof dsn === "string" ? dsn : null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function forwardEnvelope(
  request: Request,
  dsnSetting: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<Response> {
  const configured = parseSentryDsn(dsnSetting);
  if (!configured) return new Response(null, { status: 404 });

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_ENVELOPE_BYTES) {
    return new Response(null, { status: 413 });
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_ENVELOPE_BYTES) return new Response(null, { status: 413 });

  const target = parseSentryDsn(readEnvelopeDsn(body));
  if (!target || !isSameDsn(target, configured)) return new Response(null, { status: 400 });

  try {
    const upstream = await fetchImpl(envelopeUrl(configured), {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body,
    });
    return new Response(null, { status: upstream.status });
  } catch {
    return new Response(null, { status: 502 });
  }
}
