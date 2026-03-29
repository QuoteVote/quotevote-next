'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { MessageCircle, Flag, MoreHorizontal, Pencil } from 'lucide-react';
import { useAppStore } from '@/store';
import { toast } from 'sonner';
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ProfileBadge, ProfileBadgeContainer } from './ProfileBadge';

interface ProfileHeaderProps {
  profileUser: ProfileUser;
}

export function ProfileHeader({ profileUser }: ProfileHeaderProps) {
  const router = useRouter();
  const loggedInUserId = useAppStore((state) => state.user.data._id || state.user.data.id);
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

      toast(message);
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
      toast.success('User reported successfully. Thank you for helping keep our platform safe.');
      setReportDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to report user');
    }
  };

  // Handle avatar object structure
  const avatarSrc =
    typeof avatar === 'string'
      ? avatar
      : avatar?.url || undefined;

  const followersCount = _followersId?.length || 0;
  const followingCount = _followingId?.length || 0;

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Cover banner */}
      <div className="h-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40 animate-gradient-x" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '20px 20px' }} />
      </div>

      {/* Profile info section */}
      <div className="px-6 pb-6">
        {/* Avatar overlapping banner */}
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="ring-4 ring-card rounded-full">
            <Avatar
              src={avatarSrc}
              alt={username}
              size={96}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-14">
            {sameUser ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/profile/${username}/avatar`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                <FollowButton
                  isFollowing={isFollowing}
                  profileUserId={_id}
                  username={username}
                />
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleMessageUser}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive cursor-pointer"
                      onClick={() => setReportDialogOpen(true)}
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Report Bot
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Username + handle */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{username}</h2>
            {contributorBadge && (
              <ProfileBadgeContainer>
                <ProfileBadge type="contributor" />
              </ProfileBadgeContainer>
            )}
          </div>
          <p className="text-muted-foreground text-sm">@{username}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push(`/dashboard/profile/${username}/followers`)}
            className="cursor-pointer hover:underline text-sm text-foreground hover:scale-105 transition-transform"
          >
            <span className="font-extrabold text-base">{followersCount}</span>{' '}
            <span className="text-muted-foreground">Followers</span>
          </button>
          <button
            onClick={() => router.push(`/dashboard/profile/${username}/following`)}
            className="cursor-pointer hover:underline text-sm text-foreground hover:scale-105 transition-transform"
          >
            <span className="font-extrabold text-base">{followingCount}</span>{' '}
            <span className="text-muted-foreground">Following</span>
          </button>
        </div>
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
