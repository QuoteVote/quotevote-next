import fs from "fs";
import path from "path";
import { PHASE_TEST } from "next/constants";
import createNextConfig from "../../../next.config";

const nextConfig = createNextConfig(PHASE_TEST);

const APP_DIR = path.resolve(__dirname, "../../app");

// Paths the legacy API puts in its emails (invite approval, password reset, request access).
const LEGACY_EMAIL_PATHS = ["signup", "password-reset", "request-access"];

const routeExists = (segment: string): boolean =>
  [
    path.join(APP_DIR, "auths", segment),
    path.join(APP_DIR, "auths", "(card)", segment),
    path.join(APP_DIR, "auths", "(split)", segment),
  ].some((dir) => fs.existsSync(path.join(dir, "page.tsx")));

describe("next.config redirects", () => {
  it("redirects legacy /auth/* email links to the /auths/* pages", async () => {
    const redirects = await nextConfig.redirects!();
    const rule = redirects.find((r) => r.source === "/auth/:path*");

    expect(rule).toBeDefined();
    expect(rule?.destination).toBe("/auths/:path*");
  });

  it("keeps the /auth/* redirect temporary", async () => {
    const redirects = await nextConfig.redirects!();
    const rule = redirects.find((r) => r.source === "/auth/:path*");

    expect(rule).toMatchObject({ permanent: false });
  });

  it.each(LEGACY_EMAIL_PATHS)("has an /auths/%s page for the redirect to land on", (segment) => {
    expect(routeExists(segment)).toBe(true);
  });
});
