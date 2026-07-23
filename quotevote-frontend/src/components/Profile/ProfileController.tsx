'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { useAppStore } from '@/store';
import { GET_USER } from '@/graphql/queries';
import { ProfileView } from './ProfileView';
import type { ProfileUser } from '@/types/profile';

export function ProfileController() {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const loggedInUser = useAppStore((state) => state.user.data);
  const setSelectedPage = useAppStore((state) => state.setSelectedPage);

  const targetUsername =
    (typeof paramUsername === 'string' && paramUsername.trim()) ||
    (typeof loggedInUser?.username === 'string' && loggedInUser.username.trim()) ||
    '';

  const { data: userData, loading } = useQuery<{
    user?: ProfileUser | null;
  }>(GET_USER, {
    variables: { username: targetUsername },
    skip: !targetUsername,
  });

  useEffect(() => {
    setSelectedPage('');
  }, [setSelectedPage]);

  // Keep SSR and the first client paint on the loading UI until the persisted
  // store rehydrates a username (or a route param is present). Otherwise the
  // server can render LoadingSpinner while the client briefly renders
  // "Invalid user" and triggers a hydration mismatch.
  if (!targetUsername || loading) {
    return <ProfileView loading />;
  }

  return (
    <ProfileView
      profileUser={userData?.user ?? undefined}
      loading={false}
    />
  );
}
