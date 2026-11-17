import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./src/lib/security/csp";

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
const wsUrl = serverUrl.replace(/^http/, "ws");

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize images
  images: {
    // Safe because remotePatterns below is empty: only our own SVGs (like /api/avatar) can pass.
    dangerouslyAllowSVG: true,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Avatars are rendered first-party by /api/avatar (#722), so no remote avatar hosts.
    remotePatterns: [],
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
              serverUrl,
              wsUrl,
            }),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
