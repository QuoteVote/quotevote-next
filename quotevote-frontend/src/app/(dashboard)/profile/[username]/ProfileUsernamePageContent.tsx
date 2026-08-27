'use client';

import { ProfileController } from '@/components/Profile/ProfileController';

interface Props {
  username: string;
}

export function ProfileUsernamePage({ username: _username }: Props) {
  return <ProfileController />;
}
