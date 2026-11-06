/**
 * Following Page
 * 
 * Dashboard page for viewing users that a profile is following.
 * Migrated from FollowInfo component with "following" filter.
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
    title: pageTitle(`Following · ${handle}`),
    description: `People ${handle} follows on ${SITE_NAME}.`,
    path: `/profile/${encodeURIComponent(username)}/following`,
  });
}

export default function FollowingPage(): React.ReactNode {
  return <FollowInfo filter="following" />;
}
