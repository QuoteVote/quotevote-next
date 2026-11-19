'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client/react';
import { useAppStore } from '@/store';
import { toast } from 'sonner';
import type { ProfileUser, ReportBotResult } from '@/types/profile';
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
import { cn } from '@/lib/utils';
import useGuestGuard from '@/hooks/useGuestGuard';
import { useUserBlock } from '@/hooks/useUserBlock';

interface ProfileHeaderProps {
  profileUser: ProfileUser;
}

function getStatusLabel(status: string): string {
  if (status === 'dnd') return 'Do Not Disturb';
  if (status === 'invisible') return 'Invisible';
  if (!status) return 'Online';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const STATUS_DOT: Record<string, string> = {
  online: '#22c38e',
  away: '#f6c343',
  dnd: '#e5484d',
};

export function ProfileHeader({ profileUser }: ProfileHeaderProps) {
  const router = useRouter();
  const loggedInUser = useAppStore((state) => state.user.data);
  const loggedInUserId = loggedInUser?._id || loggedInUser?.id;
  const loggedInUsername = loggedInUser?.username;
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom);
  const setChatOpen = useAppStore((state) => state.setChatOpen);
  const userStatus = useAppStore((state) => state.chat.userStatus || 'online');
  const userStatusMessage = useAppStore((state) => state.chat.userStatusMessage || '');
  const presenceMap = useAppStore((state) => state.chat.presenceMap);
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
        recipientId: _id,
        username: username || undefined,
      };
      setSelectedChatRoom(staged);
    }
    setChatOpen(true);
  };

  const [reportBot, { loading: reportLoading }] = useMutation<{
    reportBot: ReportBotResult | null;
  }>(REPORT_BOT);

  const handleReportBot = async () => {
    try {
      const { data } = await reportBot({
        variables: {
          userId: _id,
          reporterId: loggedInUserIdString,
        },
      });
      // Reporting someone you already reported is a normal outcome, not a failure: close the
      // dialog and say so in a neutral toast instead of an error.
      if (data?.reportBot?.code === 'ALREADY_REPORTED') {
        toast.info(data.reportBot.message ?? 'You have already reported this user as a bot');
      } else {
        toast.success('User reported successfully!', {
          description: 'Thank you for helping keep Quote.Vote safe.',
        });
      }
      setReportDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to report user');
    }
  };


  const followersCount = _followersId?.length || 0;
  const followingCount = _followingId?.length || 0;
  // Own status from the status editor; others' from the presence feed.
  const presence = sameUser
    ? { status: userStatus, message: userStatusMessage }
    : (() => {
        const p = _id ? presenceMap?.[String(_id)] : undefined;
        return p ? { status: p.status, message: p.statusMessage } : null;
      })();
  const showStatus = presence && presence.status && presence.status !== 'invisible' && presence.status !== 'offline';
  const statusText = presence ? presence.message || getStatusLabel(presence.status) : '';
  const dot = presence ? STATUS_DOT[presence.status] : undefined;
  const score = profileUser.reputation ? Math.round(profileUser.reputation.overallScore) : null;

  const stat =
    'flex flex-col rounded-[12px] p-2.5 text-[var(--shell-ink)] no-underline lg:flex-row lg:items-baseline lg:gap-1 lg:rounded-none lg:bg-transparent! lg:p-0 lg:text-sm lg:font-semibold lg:text-[var(--auth-ink-2)] lg:hover:underline [.neo-brutalism_&]:max-lg:rounded-[4px] [.neo-brutalism_&]:max-lg:border-2 [.neo-brutalism_&]:max-lg:border-[var(--inv-panel-line)]';
  const statNum = 'text-[17px] font-bold text-[var(--shell-ink)]';
  const statLabel = 'text-[12.5px] font-bold text-[var(--auth-muted)] lg:text-sm lg:font-semibold lg:text-[var(--auth-ink-2)]';

  return (
    <section
      data-testid="profile-header"
      aria-label={`${name || username}'s profile`}
      className={cn(
        'qv-auth relative grid grid-cols-[auto_1fr] gap-3 px-4 font-redesign [grid-template-areas:"avatar_actions"_"name_name"_"bio_bio"_"stats_stats"]',
        'lg:grid-cols-1 lg:gap-3.5 lg:rounded-[18px] lg:border lg:border-[var(--inv-panel-line)] lg:bg-[var(--auth-surface)] lg:p-6 lg:shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] lg:[grid-template-areas:"avatar"_"name"_"bio"_"stats"_"actions"]',
        '[.neo-brutalism_&]:lg:rounded-[4px] [.neo-brutalism_&]:lg:border-2 [.neo-brutalism_&]:lg:shadow-[var(--inv-panel-shadow)]'
      )}
    >
      <div className="relative -mt-[43px] w-fit [grid-area:avatar] lg:-mt-[70px]">
        <div className="rounded-full border-4 border-[var(--inv-ground)] shadow-[0_6px_16px_-6px_rgba(15,23,42,0.3)] lg:border-[5px] lg:border-[var(--auth-surface)]">
          <DisplayAvatar
            avatar={avatar as string | Record<string, unknown> | undefined}
            /* Same seed as the chat header, so an unset avatar matches everywhere. */
            username={name || username}
            size={108}
            className="size-[78px] lg:size-[98px]"
          />
        </div>
        {showStatus && dot && (
          <span
            aria-hidden="true"
            className="absolute right-0.5 bottom-0.5 size-[18px] rounded-full border-[3px] border-[var(--auth-surface)] lg:right-1 lg:bottom-1 lg:size-[22px] lg:border-4"
            style={{ background: dot }}
          />
        )}
      </div>

      <div className="relative flex items-end justify-end gap-1.5 [grid-area:actions] lg:justify-start lg:gap-2">
        {sameUser ? (
          <Link
            href={`/profile/${username}/edit`}
            data-testid="edit-profile-button"
            className="qv-auth-btn max-lg:h-9! max-lg:px-3! max-lg:text-[13px]! lg:flex-1"
          >
            Edit Profile
          </Link>
        ) : (
          <>
            <FollowButton
              design
              isFollowing={isFollowing}
              profileUserId={_id}
              username={username}
              className="order-2 max-lg:h-9! max-lg:px-3! lg:order-1 lg:flex-1"
            />
            <button
              type="button"
              onClick={handleMessageUser}
              className="qv-auth-btn order-1 max-lg:h-9! max-lg:px-3! lg:order-2 lg:flex-1"
            >
              Message
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More options"
                  className="qv-auth-btn order-3 w-9 px-0! max-lg:h-9! lg:w-11"
                >
                  ⋯
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="qv-auth qv-inv-popover w-[190px] p-1.5">
                <DropdownMenuItem
                  className="h-11 cursor-pointer rounded-[12px] bg-[#fdecec] px-3 text-sm font-bold text-[#a12424] focus:bg-[#fbdcdc] focus:text-[#a12424] [.dark_&]:bg-[#3a1a1e] [.dark_&]:text-[#ff9a9a]"
                  onClick={() => setReportDialogOpen(true)}
                >
                  Report Bot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <div className="[grid-area:name]">
        <h1 className="qv-auth-display m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xl! tracking-[-0.02em]! lg:text-[30px]!">
          {name || username}
          {contributorBadge && (
            <span className="qv-auth-tag bg-[#ece5fd]! text-[#5530a8]!" title="Founder Badge">
              ✦ Contributor
            </span>
          )}
        </h1>
        <p className="m-0 mt-0.5 text-[13px] font-semibold text-[var(--auth-muted)] lg:mt-1 lg:text-sm">
          @{username}
          {showStatus && (
            <>
              {' · '}
              <span
                className={presence?.status === 'online' ? 'text-[#11683d] [.dark_&]:text-[#7fdcb0]' : undefined}
                title={statusText}
              >
                {statusText}
              </span>
            </>
          )}
        </p>
      </div>

      {profileUser.bio ? (
        <p className="m-0 text-sm leading-[1.55]! text-[var(--auth-ink-2)] [grid-area:bio] lg:text-[15px] lg:leading-[1.6]!">
          {profileUser.bio}
        </p>
      ) : (
        <span className="hidden" />
      )}

      <div className="grid grid-cols-3 gap-2 [grid-area:stats] lg:flex lg:gap-[22px]">
        <button
          type="button"
          onClick={() => router.push(`/profile/${username}/followers`)}
          className={cn(stat, 'qv-pub-tint-blue cursor-pointer border-0 text-left')}
        >
          <b className={statNum}>{followersCount}</b>
          <span className={statLabel}>Followers</span>
        </button>
        <button
          type="button"
          onClick={() => router.push(`/profile/${username}/following`)}
          className={cn(stat, 'qv-pub-tint-green cursor-pointer border-0 text-left')}
        >
          <b className={statNum}>{followingCount}</b>
          <span className={statLabel}>Following</span>
        </button>
        {score !== null && (
          <div className={cn(stat, 'qv-pub-tint-yellow lg:hidden')}>
            <b className={statNum}>{score}</b>
            <span className={statLabel}>Reputation</span>
          </div>
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
    </section>
  );
}
