/**
 * Error tracking types (#183).
 */

/** The parts of a Sentry DSN the tunnel needs to forward an envelope. */
export interface ParsedDsn {
  protocol: "http:" | "https:";
  host: string;
  projectId: string;
  publicKey: string;
}

/** Where a reported error was caught. */
export type ErrorReportSource = "error-boundary" | "error-page";

export interface ErrorReportContext {
  source: ErrorReportSource;
  /** Next.js digest for errors from server rendering, when there is one. */
  digest?: string;
}
