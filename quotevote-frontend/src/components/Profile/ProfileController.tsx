'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { useAppStore } from '@/store';
import { GET_USER, GET_USER_BIO } from '@/graphql/queries';
import { ProfileView } from './ProfileView';
import type { ProfileUser } from '@/types/profile';

function subscribePersistHydration(onChange: () => void): () => void {
  return useAppStore.persist.onFinishHydration(onChange);
}

function getPersistHydrated(): boolean {
  return useAppStore.persist.hasHydrated();
}

export function ProfileController() {
  const router = useRouter();
  const { username: paramUsername } = useParams<{ username?: string }>();
  const loggedInUser = useAppStore((state) => state.user.data);
  const setSelectedPage = useAppStore((state) => state.setSelectedPage);
  const storeHydrated = useSyncExternalStore(
    subscribePersistHydration,
    getPersistHydrated,
    () => false
  );

  const targetUsername =
    (typeof paramUsername === 'string' && paramUsername.trim()) ||
    (typeof loggedInUser?.username === 'string' && loggedInUser.username.trim()) ||
    '';

  const {
    data: userData,
    loading,
    error,
  } = useQuery<{
    user?: ProfileUser | null;
  }>(GET_USER, {
    variables: { username: targetUsername },
    skip: !targetUsername,
    errorPolicy: 'all',
  });

  // Isolated from GET_USER so a hosted schema without `User.bio` cannot
  // blank the profile page (#440). Local backends that expose bio still
  // populate the About tab (#362).
  const { data: bioData } = useQuery<{
    user?: { _id: string; bio?: string | null } | null;
  }>(GET_USER_BIO, {
    variables: { username: targetUsername },
    skip: !targetUsername,
    errorPolicy: 'all',
  });

  useEffect(() => {
    setSelectedPage('');
  }, [setSelectedPage]);

  useEffect(() => {
    if (!storeHydrated || targetUsername) return;
    router.replace('/auths/login');
  }, [storeHydrated, targetUsername, router]);

  // Keep SSR and the first client paint on the loading UI until the persisted
  // store rehydrates a username (or a route param is present). Otherwise the
  // server can render LoadingSpinner while the client briefly renders
  // "Invalid user" and triggers a hydration mismatch.
  if (!storeHydrated || !targetUsername || loading) {
    return <ProfileView loading />;
  }

  if (error && !userData?.user) {
    return (
      <ProfileView
        loading={false}
        errorMessage="This profile could not be loaded. Try again, or return to Explore."
      />
    );
  }

  const profileUser = userData?.user
    ? {
        ...userData.user,
        bio: bioData?.user?.bio ?? userData.user.bio,
      }
    : undefined;

  return (
    <ProfileView
      profileUser={profileUser}
      loading={false}
    />
  );
}
