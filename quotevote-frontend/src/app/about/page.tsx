import type { Metadata } from "next";
import { AboutPageContent } from "@/app/components/AboutPage/AboutPageContent";

export const metadata: Metadata = {
  title: "About — Quote.Vote",
  description:
    "Quote.Vote is a neutral public square for structured dialogue. Quote what matters, vote on specific ideas, and talk in the open.",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
