'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { MessageCircle, Flag, MoreHorizontal, Pencil } from 'lucide-react';
import { useAppStore } from '@/store';
import { toast } from 'sonner';
import type { ProfileUser } from '@/types/profile';
import type { StagedChatRoom } from '@/types/chat';
import { GET_CHAT_ROOM } from '@/graphql/queries';
import { REPORT_BOT } from '@/graphql/mutations';
import { DisplayAvatar } from '@/components/DisplayAvatar';
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
import { ProfileBio } from './ProfileBio';
import { cn } from '@/lib/utils';
import { FOCUS_RING_CLASS } from '@/lib/constants/formControls';
import useGuestGuard from '@/hooks/useGuestGuard';
import { useUserBlock } from '@/hooks/useUserBlock';
import { useProfileBackground } from '@/hooks/useProfileBackground';
import {
  getProfileBackgroundStyle,
  DEFAULT_PROFILE_BG_COLOR,
  DEFAULT_PROFILE_BG_PATTERN,
} from '@/lib/utils/profileBackground';

interface ProfileHeaderProps {
  profileUser: ProfileUser;
}

function getStatusLabel(status: string): string {
  if (status === 'dnd') return 'Do Not Disturb';
  if (status === 'invisible') return 'Invisible';
  if (!status) return 'Online';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusDotClass(status: string): string {
  if (status === 'online') return 'bg-[#52b274]';
  if (status === 'away') return 'bg-amber-400';
  if (status === 'dnd') return 'bg-red-500';
  return 'bg-zinc-400';
}

export function ProfileHeader({ profileUser }: ProfileHeaderProps) {
  const router = useRouter();
  const loggedInUser = useAppStore((state) => state.user.data);
  const loggedInUserId = loggedInUser?._id || loggedInUser?.id;
  const loggedInUsername = loggedInUser?.username;
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const setChatOpen = useAppStore((state) => state.setChatOpen);
  const userStatus = useAppStore((state) => state.chat.userStatus || 'online');
  const userStatusMessage = useAppStore((state) => state.chat.userStatusMessage || '');
  const { color: profileBgColor, pattern: profileBgPattern } = useProfileBackground();
  const loggedInUserIdString = typeof loggedInUserId === 'string' ? loggedInUserId : String(loggedInUserId || '');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const ensureAuth = useGuestGuard();

  const {
    username,
    name,
    _id,
    _followingId = [],
    _followersId = [],
    avatar,
    contributorBadge,
  } = profileUser;

  // ponytail: robust check for current user matching either id or username (RC1-010)
  const sameUser =
    Boolean(loggedInUserIdString && _id && String(_id) === loggedInUserIdString) ||
    Boolean(loggedInUsername && username && loggedInUsername.toLowerCase() === username.toLowerCase());

  const followersArray = Array.isArray(_followersId) ? _followersId : typeof _followersId === 'string' ? [_followersId] : [];
  const isFollowing = followersArray.includes(loggedInUserIdString);

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
  const { blockedByMe, blockedMe } = useUserBlock(
    !loggedInUserIdString || sameUser ? undefined : _id?.toString()
  );
  const blockingStatus = blockedByMe ? 'blocker' : blockedMe ? 'blocked' : null;

  const isBlocked = blockingStatus !== null;

  const room = !chatLoading && data?.messageRoom;

  const handleMessageUser = async () => {
    if (!ensureAuth()) return;

    if (isBlocked) {
      const isBlocker = blockingStatus === 'blocker';
      const message = isBlocker
        ? 'You have blocked this user. You cannot send messages to them.'
        : 'You have been blocked by this user. You cannot send messages.';

      toast(message);
      return;
    }

    if (room && room._id) {
      // Existing DM — open the conversation in the right-side panel.
      setSelectedChatRoom(room._id);
    } else {
      // No DM yet — stage a new conversation so the right-side MessageBox
      // opens the compose view directly (same flow as the chat buddy list).
      const staged: StagedChatRoom = {
        _id: null,
        title: name || username || 'Chat',
        avatar: typeof avatar === 'string' ? avatar : null,
        messageType: 'USER',
        users: [loggedInUserIdString, _id],
        username: username || undefined,
      };
      setSelectedChatRoom(staged);
    }
    setChatOpen(true);
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


  const followersCount = _followersId?.length || 0;
  const followingCount = _followingId?.length || 0;

  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm">
      {/* Cover banner — customizable color + pattern on your own profile;
          other users default to the brand green zigzag. */}
      <div className="h-28 relative overflow-hidden z-0">
        <div
          className="absolute inset-0"
          style={
            sameUser
              ? getProfileBackgroundStyle(profileBgColor, profileBgPattern)
              : getProfileBackgroundStyle(
                  DEFAULT_PROFILE_BG_COLOR,
                  DEFAULT_PROFILE_BG_PATTERN
                )
          }
          data-testid="profile-cover"
        />
      </div>

      {/* Profile info section */}
      <div className="px-5 pb-4 relative z-10">
        {/* Avatar overlapping banner */}
        {/* The actions wrap under the avatar on phones too narrow to fit both. */}
        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-3 -mt-10 mb-3">
          <div className="ring-4 ring-card rounded-full shrink-0">
            <DisplayAvatar
              avatar={avatar as string | Record<string, unknown> | undefined}
              /* Seed the default avatar with the same value the chat/message
                 header uses (the room title = the user's display name), so an
                 unset avatar looks identical in the profile and in messages. */
              username={name || username}
              size={96}
            />
          </div>

          {/* Action buttons */}
          <div className="ml-auto flex items-center gap-2 sm:pt-14">
            {sameUser ? (
              <Button variant="outline" asChild className={FOCUS_RING_CLASS}>
                <Link href={`/profile/${username}/edit`} data-testid="edit-profile-button">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit Profile
                </Link>
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
                  <MessageCircle className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                  {/* Icon-only on phones so Following, Message and More fit next to the avatar. */}
                  <span className="max-sm:sr-only">Message</span>
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

        {/* Display name + handle */}
        <div className="space-y-0.5 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{name || username}</h2>
            {contributorBadge && (
              <ProfileBadgeContainer>
                <ProfileBadge type="contributor" />
              </ProfileBadgeContainer>
            )}
          </div>
          <p className="text-muted-foreground text-sm">@{username}</p>
          <ProfileBio bio={profileUser.bio} />
          {sameUser && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs">
              <span
                className={cn('h-2 w-2 rounded-full', getStatusDotClass(userStatus))}
                aria-hidden="true"
              />
              <span
                className="text-foreground/80 truncate max-w-[260px]"
                title={userStatusMessage || getStatusLabel(userStatus)}
              >
                {userStatusMessage || getStatusLabel(userStatus)}
              </span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => router.push(`/profile/${username}/followers`)}
            className={cn(
              'min-h-8 cursor-pointer rounded-md text-sm text-foreground hover:underline',
              FOCUS_RING_CLASS
            )}
          >
            <span className="font-extrabold text-base">{followersCount}</span>{' '}
            <span className="text-muted-foreground">Followers</span>
          </button>
          <button
            type="button"
            onClick={() => router.push(`/profile/${username}/following`)}
            className={cn(
              'min-h-8 cursor-pointer rounded-md text-sm text-foreground hover:underline',
              FOCUS_RING_CLASS
            )}
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
