/**
 * Followers Page
 * 
 * Dashboard page for viewing users that follow a profile.
 * Migrated from FollowInfo component with "followers" filter.
 */

import type { Metadata } from 'next';
import { FollowInfo } from '@/components/Profile/FollowInfo';
import { buildPageMetadata, decodeParam, pageTitle, SITE_NAME } from '@/lib/seo/metadata';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeParam((await params).username);
  const handle = `@${username}`;
  return buildPageMetadata({
    title: pageTitle(`Followers · ${handle}`),
    description: `People who follow ${handle} on ${SITE_NAME}.`,
    path: `/profile/${encodeURIComponent(username)}/followers`,
  });
}

export default function FollowersPage(): React.ReactNode {
  return <FollowInfo filter="followers" />;
}
