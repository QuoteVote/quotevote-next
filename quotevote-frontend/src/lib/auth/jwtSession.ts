/**
 * Edge-safe JWT session inspection for Next.js middleware.
 *
 * When JWT_SECRET is configured, HS256 signatures are verified via Web Crypto
 * (authoritative). When it is not, only structural + expiry checks run — admin
 * claims are never trusted without signature verification.
 */

export type JwtSession =
  | { status: "valid"; admin: boolean; verified: boolean }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "missing" };

function decodeBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const padded = normalized + pad;
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(padded, "base64"));
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodePayloadJson(payloadB64: string): Record<string, unknown> | null {
  try {
    const bytes = decodeBase64Url(payloadB64);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isExpiredPayload(payload: Record<string, unknown>): boolean {
  const exp = payload.exp;
  if (typeof exp !== "number") return true;
  return exp * 1000 <= Date.now();
}

async function verifyHs256(
  token: string,
  secret: string
): Promise<Record<string, unknown> | "expired" | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;

  let header: Record<string, unknown>;
  try {
    header = JSON.parse(new TextDecoder().decode(decodeBase64Url(headerB64))) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;

  const payload = decodePayloadJson(payloadB64);
  if (!payload) return null;

  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = decodeBase64Url(signatureB64);

  // Prefer Node HMAC when available (Jest / Node). Avoid a static `crypto`
  // import so Next.js Edge middleware bundling stays valid.
  const nodeVerified = verifyHs256WithNodeHmac(signingInput, signature, secret);
  if (nodeVerified !== undefined) {
    if (!nodeVerified) return null;
    if (isExpiredPayload(payload)) return "expired";
    return payload;
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;

  const key = await subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  // Copy into a standalone Uint8Array — some runtimes reject Buffer-backed views.
  const signatureCopy = new Uint8Array(signature.byteLength);
  signatureCopy.set(signature);
  const valid = await subtle.verify(
    "HMAC",
    key,
    signatureCopy,
    new TextEncoder().encode(signingInput)
  );
  if (!valid) return null;
  if (isExpiredPayload(payload)) return "expired";
  return payload;
}

/**
 * Returns true/false when Node crypto is usable, or undefined to fall back.
 */
function verifyHs256WithNodeHmac(
  signingInput: string,
  signature: Uint8Array,
  secret: string
): boolean | undefined {
  if (typeof process === "undefined" || typeof process.versions?.node !== "string") {
    return undefined;
  }
  try {
    // Dynamic require keeps this optional for Edge bundles.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto") as typeof import("crypto");
    const expected = nodeCrypto.createHmac("sha256", secret).update(signingInput, "utf8").digest();
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length) return false;
    return nodeCrypto.timingSafeEqual(expected, actual);
  } catch {
    return undefined;
  }
}

/**
 * Resolve whether a cookie token represents a usable session.
 */
export async function resolveJwtSession(token: string | undefined | null): Promise<JwtSession> {
  if (!token) return { status: "missing" };

  const secret = process.env.JWT_SECRET;
  if (secret) {
    try {
      const result = await verifyHs256(token, secret);
      if (result === "expired") return { status: "expired" };
      if (!result) return { status: "invalid" };
      return {
        status: "valid",
        admin: result.admin === true,
        verified: true,
      };
    } catch {
      return { status: "invalid" };
    }
  }

  const parts = token.split(".");
  if (parts.length !== 3) return { status: "invalid" };
  const payload = decodePayloadJson(parts[1]);
  if (!payload) return { status: "invalid" };
  if (isExpiredPayload(payload)) return { status: "expired" };

  // Without JWT_SECRET we cannot trust claims — treat as a non-admin session
  // for middleware UX only. Server APIs remain the authorization boundary.
  return { status: "valid", admin: false, verified: false };
}

export function clearAuthCookie(response: {
  cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void };
}): void {
  response.cookies.set("qv-token", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}
