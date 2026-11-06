import type { Metadata } from "next";
import { buildPageMetadata, pageTitle } from "@/lib/seo/metadata";
import { AboutPageContent } from "@/app/components/AboutPage/AboutPageContent";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("About"),
  description:
    "Quote.Vote is a neutral public square for structured dialogue. Quote what matters, vote on specific ideas, and talk in the open.",
  path: "/about",
});

export default function AboutPage() {
  return <AboutPageContent />;
}
