import { forwardEnvelope } from "@/lib/errorTracking/tunnel";

// Same-origin endpoint for browser error reports (#183). See lib/errorTracking/tunnel.ts.
export async function POST(request: Request): Promise<Response> {
  return forwardEnvelope(request, process.env.NEXT_PUBLIC_SENTRY_DSN);
}
