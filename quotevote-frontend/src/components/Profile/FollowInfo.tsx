'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/store';
import type { FollowInfoProps } from '@/types/profile';
import { GET_FOLLOW_INFO } from '@/graphql/queries';
import { UserFollowDisplay } from './UserFollowDisplay';
import { NoFollowers } from './NoFollowers';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function FollowInfo({ filter }: FollowInfoProps) {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const userData = useAppStore((state: { user: { data: { _id?: string; _followingId?: string | string[] } } }) => state.user.data);

  const { data, error, loading } = useQuery<{
    getUserFollowInfo?: Array<{
      id: string;
      username: string;
      avatar?: string | { url?: string };
      numFollowers: number;
      numFollowing: number;
    }>;
  }>(GET_FOLLOW_INFO, {
    variables: { username, filter },
    skip: !username,
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  if (data?.getUserFollowInfo) {
    const { getUserFollowInfo } = data;
    if (getUserFollowInfo.length === 0) {
      return (
        <div id="component-followers-display">
          <div
            id="component-banner"
            className="flex items-center gap-4 p-4 border-b"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Go Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <p>
              {filter === 'followers'
                ? `${getUserFollowInfo.length} Followers`
                : `${getUserFollowInfo.length} Following`}
            </p>
          </div>
          <NoFollowers filter={filter} />
        </div>
      );
    }

    const currentUserId = userData?._id || '';
    const followingId = userData?._followingId || [];
    const followingArray = Array.isArray(followingId)
      ? followingId
      : typeof followingId === 'string'
      ? [followingId]
      : [];

    return (
      <div id="component-followers-display">
        <div
          id="component-banner"
          className="flex items-center gap-4 p-4 border-b"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <p>
            {filter === 'followers'
              ? `${getUserFollowInfo.length} Followers`
              : `${getUserFollowInfo.length} Following`}
          </p>
        </div>
        <div id="component-follows-list" className="divide-y">
          {getUserFollowInfo.map((f: {
            id: string;
            username: string;
            avatar?: string | { url?: string };
            numFollowers: number;
            numFollowing: number;
          }) => (
            <UserFollowDisplay
              key={f.id}
              profileUserId={currentUserId}
              isFollowing={followingArray.includes(f.id)}
              id={f.id}
              username={f.username}
              avatar={f.avatar}
              numFollowers={f.numFollowers}
              numFollowing={f.numFollowing}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

