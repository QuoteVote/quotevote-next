import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/settings",
        "/notifications",
        "/manage-invites",
        "/control-panel",
        "/logout",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
