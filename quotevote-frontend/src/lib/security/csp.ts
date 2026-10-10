/**
 * Content-Security-Policy helpers shared by next.config and regression tests.
 */

export function buildScriptSrcDirective(isProduction: boolean): string {
  // Production drops unsafe-eval to block eval()-style XSS vectors.
  // unsafe-inline remains until nonce/hash migration for Next.js runtime scripts.
  if (isProduction) {
    return "script-src 'self' 'unsafe-inline'";
  }
  return "script-src 'self' 'unsafe-eval' 'unsafe-inline'";
}

export function buildContentSecurityPolicy(options: {
  isProduction: boolean;
  serverUrl: string;
  wsUrl: string;
}): string {
  const { isProduction, serverUrl, wsUrl } = options;
  return [
    "default-src 'self'",
    buildScriptSrcDirective(isProduction),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${serverUrl} ${wsUrl} https://fonts.googleapis.com https://fonts.gstatic.com`,
    "frame-ancestors 'none'",
  ].join("; ");
}
