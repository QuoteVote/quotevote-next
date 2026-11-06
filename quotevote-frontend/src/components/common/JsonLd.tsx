import type { ReactNode } from "react";
import { serializeJsonLd } from "@/lib/seo/jsonLd";
import type { JsonLdProps } from "@/types/seo";

export function JsonLd({ data }: JsonLdProps): ReactNode {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
