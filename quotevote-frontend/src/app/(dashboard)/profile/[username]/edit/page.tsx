import type { Metadata } from "next";
import { buildPageMetadata, decodeParam, pageTitle } from "@/lib/seo/metadata";
import EditProfilePageClient from "./EditProfilePageClient";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeParam((await params).username);
  return buildPageMetadata({
    title: pageTitle("Edit profile"),
    description: "Change your photo, name, username, About and banner.",
    path: `/profile/${encodeURIComponent(username)}/edit`,
    noIndex: true,
  });
}

export const dynamic = "force-dynamic";

export default async function EditProfilePage({ params }: Props) {
  const { username } = await params;
  return <EditProfilePageClient username={decodeURIComponent(username)} />;
}
