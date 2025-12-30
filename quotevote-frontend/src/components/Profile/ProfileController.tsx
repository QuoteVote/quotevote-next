'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { useAppStore } from '@/store';
import { GET_USER } from '@/graphql/queries';
import { ProfileView } from './ProfileView';
import type { ProfileUser } from '@/types/profile';

export function ProfileController() {
  const { username } = useParams<{ username: string }>();
  const loggedInUser = useAppStore((state) => state.user.data);
  const setSelectedPage = useAppStore((state) => state.setSelectedPage);

  const { data: userData, loading } = useQuery<{
    user?: ProfileUser;
  }>(GET_USER, {
    variables: { username: username || loggedInUser.username },
    skip: !username && !loggedInUser.username,
  });

  useEffect(() => {
    setSelectedPage('');
  }, [setSelectedPage]);

  // Derive userInfo directly from query data instead of using effect
  const userInfo = userData?.user;

  return (
    <ProfileView
      profileUser={userInfo}
      loading={loading}
    />
  );
}

