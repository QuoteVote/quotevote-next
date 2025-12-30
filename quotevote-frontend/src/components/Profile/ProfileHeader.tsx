'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { MessageCircle, Flag } from 'lucide-react';
import { useAppStore } from '@/store';
import type { ProfileUser } from '@/types/profile';
import { GET_CHAT_ROOM, GET_ROSTER } from '@/graphql/queries';
import { REPORT_BOT } from '@/graphql/mutations';
import Avatar from '@/components/Avatar';
import { FollowButton } from '../CustomButtons/FollowButton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileBadge, ProfileBadgeContainer } from './ProfileBadge';

interface ProfileHeaderProps {
  profileUser: ProfileUser;
}

export function ProfileHeader({ profileUser }: ProfileHeaderProps) {
  const router = useRouter();
  const loggedInUserId = useAppStore((state) => state.user.data._id || state.user.data.id);
  const setSnackbar = useAppStore((state) => state.setSnackbar);
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const setChatOpen = useAppStore((state) => state.setChatOpen);
  const loggedInUserIdString = typeof loggedInUserId === 'string' ? loggedInUserId : String(loggedInUserId || '');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const {
    username,
    _id,
    _followingId = [],
    _followersId = [],
    avatar,
    contributorBadge,
  } = profileUser;

  const sameUser = _id === loggedInUserIdString;
  const followingArray = Array.isArray(_followingId) ? _followingId : typeof _followingId === 'string' ? [_followingId] : [];
  const isFollowing = followingArray.includes(loggedInUserIdString);

  const { data, loading: chatLoading } = useQuery<{
    messageRoom?: {
      _id: string;
      users: string[];
      postId?: string;
      messageType?: string;
      created?: string;
      title?: string;
      avatar?: string;
    };
  }>(GET_CHAT_ROOM, {
    variables: {
      otherUserId: _id,
    },
    fetchPolicy: 'network-only',
    skip: !loggedInUserIdString || sameUser,
  });

  // Check blocking status
  const { data: rosterData } = useQuery<{
    roster?: {
      buddies?: Array<{ userId?: string; buddyId?: string; status?: string }>;
      blockedUsers?: Array<{ id?: string }>;
    };
  }>(GET_ROSTER, {
    skip: !loggedInUserIdString || sameUser,
  });

  const blockingStatus = useMemo(() => {
    if (!rosterData?.roster || sameUser) return null;

    const profileUserId = _id?.toString();
    const currentUserId = loggedInUserId?.toString();

    const roster = rosterData.roster.buddies || [];
    const blockedUsers = rosterData.roster.blockedUsers || [];

    // Check if current user blocked the profile user
    const currentUserBlockedProfile = roster.some(
      (r: { userId?: string; buddyId?: string; status?: string }) => {
        const rUserId = r.userId?.toString();
        const rBuddyId = r.buddyId?.toString();
        return rUserId === currentUserId && rBuddyId === profileUserId && r.status === 'blocked';
      }
    ) || blockedUsers.some((u: { id?: string }) => u.id === profileUserId);

    // Check if profile user blocked the current user
    const profileUserBlockedCurrent = roster.some(
      (r: { userId?: string; buddyId?: string; status?: string }) => {
        const rUserId = r.userId?.toString();
        const rBuddyId = r.buddyId?.toString();
        return rUserId === profileUserId && rBuddyId === currentUserId && r.status === 'blocked';
      }
    );

    if (currentUserBlockedProfile) return 'blocker';
    if (profileUserBlockedCurrent) return 'blocked';
    return null;
  }, [rosterData, _id, loggedInUserId, sameUser]);

  const isBlocked = blockingStatus !== null;

  const room = !chatLoading && data?.messageRoom;

  const handleMessageUser = async () => {
    if (isBlocked) {
      const isBlocker = blockingStatus === 'blocker';
      const message = isBlocker
        ? 'You have blocked this user. You cannot send messages to them.'
        : 'You have been blocked by this user. You cannot send messages.';

      setSnackbar({
        open: true,
        message,
        type: 'warning',
      });
      return;
    }

    if (room) {
      setSelectedChatRoom(room._id);
      setChatOpen(true);
    }
  };

  const [reportBot, { loading: reportLoading }] = useMutation(REPORT_BOT);

  const handleReportBot = async () => {
    try {
      await reportBot({
        variables: {
          userId: _id,
          reporterId: loggedInUserIdString,
        },
      });
      setSnackbar({
        open: true,
        message: 'User reported successfully. Thank you for helping keep our platform safe.',
        type: 'success',
      });
      setReportDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to report user',
        type: 'error',
      });
    }
  };

  // Handle avatar object structure
  const avatarSrc =
    typeof avatar === 'string'
      ? avatar
      : avatar?.url || undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center gap-4">
        <Avatar
          src={avatarSrc}
          alt={username}
          size={75}
        />
        <div className="flex-1 flex flex-col gap-1">
          <h2 className="text-xl font-semibold truncate">{username}</h2>
          <div className="flex gap-4 text-sm">
            <button
              onClick={() => router.push(`/profile/${username}/followers`)}
              className="cursor-pointer hover:underline text-muted-foreground"
            >
              {_followersId?.length || 0} Followers
            </button>
            <button
              onClick={() => router.push(`/profile/${username}/following`)}
              className="cursor-pointer hover:underline text-muted-foreground"
            >
              {_followingId?.length || 0} Following
            </button>
          </div>
          {contributorBadge && (
            <div className="flex items-center mt-1">
              <ProfileBadgeContainer>
                <ProfileBadge type="contributor" />
              </ProfileBadgeContainer>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {sameUser ? (
          <Button
            variant="default"
            onClick={() => router.push(`/profile/${username}/avatar`)}
            className="w-[130px]"
          >
            Change Photo
          </Button>
        ) : (
          <>
            <FollowButton
              isFollowing={isFollowing}
              profileUserId={_id}
              username={username}
              className="w-[130px]"
            />
            <Button
              variant="default"
              size="default"
              className="w-[130px]"
              onClick={handleMessageUser}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Message
            </Button>
            <Button
              variant="outline"
              size="default"
              className="w-[130px]"
              onClick={() => setReportDialogOpen(true)}
            >
              <Flag className="mr-2 h-4 w-4" />
              Report Bot
            </Button>
          </>
        )}
      </div>

      {/* Report Bot Confirmation Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Suspected Bot</DialogTitle>
            <DialogDescription>
              Are you sure you want to report @{username} as a suspected bot?
              This action helps keep the platform safe. False reports may affect
              your reputation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReportBot}
              disabled={reportLoading}
            >
              {reportLoading ? 'Reporting...' : 'Report Bot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

