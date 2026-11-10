import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import { resolveApiAddress } from "./src/config/apiAddress";
import { buildContentSecurityPolicy } from "./src/lib/security/csp";

// The build and the dev server stop here when the API address is missing or invalid, so a
// deployment can never fall back to another environment's API. Other phases (tests, `next
// start` of an existing build) don't need it, and the CSP header is only read at build time.
const createNextConfig = (phase: string): NextConfig => {
  const needsApi = phase === PHASE_PRODUCTION_BUILD || phase === PHASE_DEVELOPMENT_SERVER;
  const api = needsApi
    ? resolveApiAddress({
        graphqlEndpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
        serverUrl: process.env.NEXT_PUBLIC_SERVER_URL,
      })
    : null;

  return {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // Optimize images
    images: {
      // ponytail: safe because remotePatterns below restrict SVG sources to trusted domains only
      dangerouslyAllowSVG: true,
      formats: ["image/avif", "image/webp"],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      remotePatterns: [
        {
          protocol: "https",
          hostname: "avataaars.io",
          pathname: "/**",
        },
        {
          // ponytail: allow api.dicebear.com remote pattern for avatar images
          protocol: "https",
          hostname: "api.dicebear.com",
          pathname: "/**",
        },
      ],
    },

    // Compress output
    compress: true,

    async redirects() {
      return [
        // Legacy comment deep links appended `/comment` as a path segment.
        // Preserve the hash client-side; strip the invalid route segment.
        {
          source: "/post/:group/:title/:postId/comment",
          destination: "/post/:group/:title/:postId",
          permanent: false,
        },
        {
          source: "/post/:group/:title/:postId/comment/",
          destination: "/post/:group/:title/:postId",
          permanent: false,
        },
        // The legacy API builds email links under `/auth/*` (invite approval signup,
        // password reset, request access), but this app serves those pages under `/auths/*`.
        // Query strings such as `?token=` are passed through by Next.js redirects.
        // Temporary, so the links can move once the API generates `/auths/*` URLs.
        {
          source: "/auth/:path*",
          destination: "/auths/:path*",
          permanent: false,
        },
      ];
    },

    // Security headers
    async headers() {
      return [
        {
          source: "/assets/about/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        {
          source: "/:path*",
          headers: [
            {
              key: "X-DNS-Prefetch-Control",
              value: "on",
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
            {
              key: "X-XSS-Protection",
              value: "1; mode=block",
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=()",
            },
            {
              key: "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
            {
              key: "Content-Security-Policy",
              value: buildContentSecurityPolicy({
                isProduction: process.env.NODE_ENV === "production",
                serverUrl: api?.httpOrigin ?? "",
                wsUrl: api?.wsOrigin ?? "",
              }),
            },
          ],
        },
      ];
    },
  };
};

export default createNextConfig;
