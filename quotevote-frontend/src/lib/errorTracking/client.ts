import * as Sentry from "@sentry/browser";
import { parseSentryDsn } from "@/lib/errorTracking/dsn";
import { scrubBreadcrumb, scrubEvent } from "@/lib/errorTracking/scrub";
import type { ErrorReportContext } from "@/types/errorTracking";

/** Same-origin route that forwards reports to Sentry, so the CSP stays as it is. */
export const ERROR_TRACKING_TUNNEL = "/monitoring";

/** Sentry collects all of these by default. Every one is turned off. */
export const ERROR_TRACKING_DATA_COLLECTION: NonNullable<
  Parameters<typeof Sentry.init>[0]
>["dataCollection"] = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  stackFrameVariables: false,
};

let enabled = false;

/**
 * Starts error tracking in the browser when NEXT_PUBLIC_SENTRY_DSN is set. Returns whether
 * it is on. Uncaught errors and unhandled promise rejections are then reported on their own.
 */
export function initErrorTracking(
  dsn: string | undefined = process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: string | undefined = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT
): boolean {
  if (enabled || !parseSentryDsn(dsn)) return enabled;

  Sentry.init({
    dsn,
    environment: environment?.trim() || process.env.NODE_ENV,
    tunnel: ERROR_TRACKING_TUNNEL,
    dataCollection: ERROR_TRACKING_DATA_COLLECTION,
    // Errors only: no performance tracing and no session counts.
    tracesSampleRate: 0,
    integrations: (defaults) =>
      defaults.filter((integration) => integration.name !== "BrowserSession"),
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: (crumb) => scrubBreadcrumb(crumb),
  });
  enabled = true;
  return enabled;
}

/** Reports an error caught by an error boundary or error page. Does nothing when off. */
export function reportError(error: unknown, context: ErrorReportContext): void {
  if (!enabled) return;
  Sentry.withScope((scope) => {
    scope.setTag("source", context.source);
    if (context.digest) scope.setTag("digest", context.digest);
    Sentry.captureException(error);
  });
}

/** Test helper: forget the started state. */
export function resetErrorTrackingForTests(): void {
  enabled = false;
}
