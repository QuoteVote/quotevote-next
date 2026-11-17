import { NextResponse, type NextRequest } from "next/server";
import { completeDraft } from "@/lib/avatar";
import { AVATAAARS_VALUES, AVATAR_KEYS } from "@/lib/avatarOptions";
import { renderAvatarSvg } from "@/lib/avatarRender";
import type { AvatarDraft, AvatarStyle } from "@/types/avatar";

/**
 * First-party avatar images (#722). Renders the Avataaars SVG on our own server from
 * the qualities in the query, so no browser or server ever contacts avataaars.io.
 * Only the 13 known qualities with known values are read; anything else is ignored,
 * and missing ones are filled with a fixed default, so every request gets an avatar
 * and the route can't be used to fetch or inject anything.
 */
export function GET(request: NextRequest): NextResponse {
  const params = request.nextUrl.searchParams;
  const known: Partial<AvatarDraft> = {};
  for (const key of AVATAR_KEYS) {
    const value = params.get(key);
    if (value !== null && AVATAAARS_VALUES[key].includes(value)) known[key] = value;
  }
  const style: AvatarStyle = params.get("avatarStyle") === "Transparent" ? "Transparent" : "Circle";
  const svg = renderAvatarSvg(completeDraft(known, ""), style);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
