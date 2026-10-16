/** Fallback Solid identity provider offered on the Settings connect form. */
export const DEFAULT_SOLID_ISSUER = "https://solidcommunity.net";

/** Path of the in-app page the Solid provider redirects back to. */
export const SOLID_CALLBACK_PATH = "/settings/solid/callback";

/** Issuer shown by default; overridable at build time via NEXT_PUBLIC_SOLID_DEFAULT_ISSUER. */
export function getDefaultSolidIssuer(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SOLID_DEFAULT_ISSUER?.trim();
  return fromEnv ? fromEnv : DEFAULT_SOLID_ISSUER;
}
