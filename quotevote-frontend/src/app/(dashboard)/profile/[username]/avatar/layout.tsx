import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata, decodeParam, pageTitle } from "@/lib/seo/metadata";

interface Props {
  children: ReactNode;
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const username = decodeParam((await params).username);
  return buildPageMetadata({
    title: pageTitle("Edit avatar"),
    description: "Customize your Quote.Vote avatar.",
    path: `/profile/${encodeURIComponent(username)}/avatar`,
    noIndex: true,
  });
}

export default function AvatarLayout({ children }: Props): ReactNode {
  return children;
}
