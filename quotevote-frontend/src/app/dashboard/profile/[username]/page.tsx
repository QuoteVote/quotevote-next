import type { Metadata } from 'next';
import { ProfileUsernamePage } from './ProfileUsernamePageContent';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username} — Quote.Vote`,
    description: `View ${username}'s profile on Quote.Vote`,
  };
}

export const dynamic = 'force-dynamic';

export default async function ProfileByUsernamePage({ params }: Props) {
  const { username } = await params;
  return <ProfileUsernamePage username={username} />;
}
