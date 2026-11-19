import type { Metadata } from "next";
import { Suspense } from "react";
import { buildPageMetadata, pageTitle } from "@/lib/seo/metadata";
import { RequestAccessPageContent } from "./PageContent";

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle("Request Access"),
  description:
    "Request an invitation to join Quote.Vote, a text-first platform for thoughtful dialogue.",
  path: "/auths/request-access",
});

export default function RequestAccessPage() {
  return (
    <Suspense>
      <RequestAccessPageContent />
    </Suspense>
  );
}
