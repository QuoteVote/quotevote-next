import { NextResponse, type NextRequest } from "next/server";
import { buildAvatarUrl, isValidDraft } from "@/lib/avatar";
import { AVATAR_KEYS } from "@/lib/avatarOptions";

const UPSTREAM_TIMEOUT_MS = 8000;

/**
 * Same-origin copy of an Avataaars SVG, so the editor can turn it into a PNG
 * (avataaars.io sends no CORS headers). Only the 13 known qualities with known
 * values are accepted, so this can't be used to fetch anything else.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const qualities: Record<string, string> = {};
  for (const key of AVATAR_KEYS) {
    const value = params.get(key);
    if (value !== null) qualities[key] = value;
  }
  if (!isValidDraft(qualities)) {
    return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });
  }

  try {
    const upstream = await fetch(buildAvatarUrl(qualities, "Circle"), {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    const body = await upstream.text();
    if (!upstream.ok || !body.trimStart().startsWith("<svg")) {
      return NextResponse.json({ error: "Avatar unavailable" }, { status: 502 });
    }
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Avatar unavailable" }, { status: 502 });
  }
}
