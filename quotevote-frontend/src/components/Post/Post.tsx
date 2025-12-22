'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import copy from 'clipboard-copy';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Ban,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { VotingBoard } from '../VotingComponents/VotingBoard';
import { VotingPopup } from '../VotingComponents/VotingPopup';
import { FollowButton } from '../CustomButtons/FollowButton';
import { BookmarkIconButton } from '../CustomButtons/BookmarkIconButton';
import { ApproveButton } from '../CustomButtons/ApproveButton';
import { RejectButton } from '../CustomButtons/RejectButton';
import { RequestInviteDialog } from '../RequestInviteDialog';

import { useAppStore } from '@/store';
import { tokenValidator } from '@/lib/utils/auth';
import { serializeVotedBy } from '@/lib/utils/objectIdSerializer';

import {
  ADD_COMMENT,
  ADD_QUOTE,
  REPORT_POST,
  VOTE,
  APPROVE_POST,
  REJECT_POST,
  DELETE_POST,
  TOGGLE_VOTING,
} from '@/graphql/mutations'; // ← Fixed path

import {
  GET_POST,
  GET_TOP_POSTS,
  GET_USER_ACTIVITY,
  GET_USERS,
} from '@/graphql/queries'; // ← Fixed path

import type { 
  PostComponentProps, 
  SelectedText, 
  VoteInput, 
  CommentInput, 
  QuoteInput 
} from '@/types/post';

/**
 * Post component - Main post display with voting, comments, and actions
 */
export function Post({
  post,
  user,
  postHeight,
  postActions,
  refetchPost,
}: PostComponentProps): JSX.Element {
  const { title, creator, created, _id, userId, text } = post;
  const { name, avatar, username } = creator;
  const { _followingId } = user;
  
  const router = useRouter();
  const parsedCreated = moment(created).format('LLL');

  // Use Zustand store instead of Redux
  const setSnackbar = useAppStore((state) => state.setSnackbar);
  const userData = useAppStore((state) => state.user?.data);
  const admin = userData?.admin || false;

  // State
  const [selectedText, setSelectedText] = useState<SelectedText>({
    text: '',
    startIndex: 0,
    endIndex: 0,
  });
  const [showCopyAlert, setShowCopyAlert] = useState<boolean>(false);
  const [openInvite, setOpenInvite] = useState<boolean>(false);

  const isFollowing = _followingId?.includes(userId) || false;

  // Guest guard
  const ensureAuth = useCallback((): boolean => {
    if (!tokenValidator()) {
      setOpenInvite(true);
      return false;
    }
    return true;
  }, []);

  // Query users for tooltips (admin only)
  const { loading: usersLoading, data: usersData, error: usersError } = useQuery(GET_USERS, {
    skip: !admin,
    errorPolicy: 'all',
  });

  // Mutations
  const [addVote] = useMutation(VOTE, {
    update() {
      refetchPost?.();
    },
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  });

  const [addComment] = useMutation(ADD_COMMENT, {
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  });

  const [addQuote] = useMutation(ADD_QUOTE, {
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_USER_ACTIVITY,
        variables: {
          limit: 15,
          offset: 0,
          searchKey: '',
          activityEvent: ['POSTED', 'VOTED', 'COMMENTED', 'QUOTED', 'LIKED'],
          user_id: user._id,
          startDateRange: '',
          endDateRange: '',
        },
      },
    ],
  });

  const [reportPost] = useMutation(REPORT_POST, {
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  });

  const [approvePost] = useMutation(APPROVE_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '', interactions: false } },
    ],
  });

  const [rejectPost] = useMutation(REJECT_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '', interactions: false } },
    ],
  });

  const [deletePost] = useMutation(DELETE_POST, {
    update(cache, { data: { deletePost } }) {
      cache.modify({
        fields: {
          posts(existing = {}, { readField }) {
            if (!existing.entities) return existing;
            return {
              ...existing,
              entities: existing.entities.filter(
                (postRef: any) => readField('_id', postRef) !== deletePost._id
              ),
            };
          },
          featuredPosts(existing = {}, { readField }) {
            if (!existing.entities) return existing;
            return {
              ...existing,
              entities: existing.entities.filter(
                (postRef: any) => readField('_id', postRef) !== deletePost._id
              ),
            };
          },
        },
      });
      cache.evict({
        id: cache.identify({ __typename: 'Post', _id: deletePost._id }),
      });
      cache.gc();
    },
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '', interactions: false } },
    ],
  });

  const [toggleVoting] = useMutation(TOGGLE_VOTING, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '', interactions: false } },
    ],
  });

  // Check user voting status
  const userIdStr = user._id?.toString();
  const hasApproved = Array.isArray(post.approvedBy) && 
    post.approvedBy.some((id) => id?.toString() === userIdStr);
  const hasRejected = Array.isArray(post.rejectedBy) && 
    post.rejectedBy.some((id) => id?.toString() === userIdStr);
  const hasVoted = Array.isArray(post.votedBy) && 
    post.votedBy.some(
      (vote) => vote.userId?.toString() === userIdStr && vote.deleted !== true
    );

  const getUserVoteType = (): 'up' | 'down' | null => {
    if (!hasVoted) return null;
    const userVote = post.votedBy.find(
      (vote) => vote.userId?.toString() === userIdStr && vote.deleted !== true
    );
    return userVote ? userVote.type : null;
  };

  // Tooltip content generators
  const getTooltipContent = (users: string[], type: 'approved' | 'rejected'): string => {
    if (!users || users.length === 0) {
      return `No users ${type} this post.`;
    }

    if (!admin) {
      return `${users.length} user(s) ${type} this post.`;
    }

    if (usersLoading || !usersData) {
      return 'Loading...';
    }

    if (usersError) {
      return 'Unable to load user details.';
    }

    const matchedUsers = usersData.users.filter((u: any) =>
      users.includes(u._id)
    );

    if (matchedUsers.length === 0) {
      return `No users ${type} this post.`;
    }

    const MAX_DISPLAY = 5;
    const displayUsers = matchedUsers.slice(0, MAX_DISPLAY);
    const remaining = matchedUsers.length - MAX_DISPLAY;

    let content = `Users who ${type} this post:\n`;
    displayUsers.forEach((u: any) => {
      content += `• @${u.username}\n`;
    });

    if (remaining > 0) {
      content += `\n... and ${remaining} more`;
    }

    return content;
  };

  // Handlers
  const handleToggleVoting = async (): Promise<void> => {
    if (!ensureAuth()) return;
    try {
      await toggleVoting({ variables: { postId: _id } });
      setSnackbar?.({
        open: true,
        message: post.enable_voting ? 'Voting disabled' : 'Voting enabled',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar?.({
        open: true,
        message: `Toggle voting error: ${err.message}`,
        type: 'danger',
      });
    }
  };

  const handleReportPost = async (): Promise<void> => {
    if (!ensureAuth()) return;
    try {
      const res = await reportPost({
        variables: { postId: _id, userId: user._id },
      });
      const { reportedBy } = res.data.reportPost;
      const reported = reportedBy.length;
      setSnackbar?.({
        open: true,
        message: `Post Reported. Total Reports: ${reported}`,
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar?.({
        open: true,
        message: `${err.message}`,
        type: 'danger',
      });
    }
  };

  const handleAddComment = async (comment: string, commentWithQuote = false): Promise<void> => {
    if (!ensureAuth()) return;

    const newComment: CommentInput = {
      userId: user._id,
      content: comment,
      startWordIndex: selectedText.startIndex,
      endWordIndex: selectedText.endIndex,
      postId: _id,
      url: post.url,
      quote: commentWithQuote ? selectedText.text : '',
    };

    try {
      await addComment({ variables: { comment: newComment } });
      setSnackbar?.({
        open: true,
        message: 'Commented Successfully',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar?.({
        open: true,
        message: `Comment Error: ${err.message}`,
        type: 'danger',
      });
    }
  };

  const handleVoting = async (obj: { type: 'up' | 'down'; tags: string[] }): Promise<void> => {
    if (!ensureAuth()) return;

    if (hasVoted) {
      setSnackbar?.({
        open: true,
        message: 'You have already voted on this post',
        type: 'warning',
      });
      return;
    }

    const vote: VoteInput = {
      content: selectedText.text || '',
      postId: post._id,
      userId: user._id,
      type: obj.type,
      tags: obj.tags,
      startWordIndex: selectedText.startIndex,
      endWordIndex: selectedText.endIndex,
    };

    try {
      await addVote({ variables: { vote } });
      setSnackbar?.({
        open: true,
        message: 'Voted Successfully',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar?.({
        open: true,
        message: `Vote Error: ${err.message}`,
        type: 'danger',
      });
    }
  };

  const handleAddQuote = async (): Promise<void> => {
    if (!ensureAuth()) return;

    const quote: QuoteInput = {
      quote: selectedText.text,
      postId: post._id,
      quoter: user._id,
      quoted: userId,
      startWordIndex: selectedText.startIndex,
      endWordIndex: selectedText.endIndex,
    };

    try {
      await addQuote({ variables: { quote } });
      setSnackbar?.({
        open: true,
        message: 'Quoted Successfully',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar?.({
        open: true,
        message: `Quote Error: ${err.message}`,
        type: 'danger',
      });
    }
  };

  const handleRedirectToProfile = (): void => {
    router.push(`/Profile/${username}`);
  };

  const copyToClipboard = async (): Promise<void> => {
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    await copy(`${baseUrl}${currentPath}`);
    setShowCopyAlert(true);
    setTimeout(() => setShowCopyAlert(false), 2000);
  };

  const handleApprovePost = async (): Promise<void> => {
    if (!ensureAuth()) return;

    try {
      await approvePost({
        variables: { postId: _id, userId: user._id, remove: hasApproved },
      });
      setSnackbar?.({
        open: true,
        message: hasApproved ? 'Approval removed' : 'Post Approved',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar?.({
        open: true,
        message: `Approve Error: ${err.message}`,
        type: 'danger',
      });
    }
  };

  const handleRejectPost = async (): Promise<void> => {
    if (!ensureAuth()) return;

    try {
      await rejectPost({
        variables: { postId: _id, userId: user._id, remove: hasRejected },
      });
      setSnackbar?.({
        open: true,
        message: hasRejected ? 'Rejection removed' : 'Post Rejected',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar?.({
        open: true,
        message: `Reject Error: ${err.message}`,
        type: 'danger',
      });
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await deletePost({ variables: { postId: _id } });
      setSnackbar?.({ open: true, message: 'Post deleted', type: 'success' });
      router.push('/search');
    } catch (err: any) {
      setSnackbar?.({
        open: true,
        message: `Delete Error: ${err.message}`,
        type: 'danger',
      });
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col overflow-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={handleRedirectToProfile}
              >
                <Avatar>
                  <AvatarImage src={avatar?.url} alt={name} />
                  <AvatarFallback style={{ backgroundColor: avatar?.color }}>
                    {avatar?.initials || name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-semibold text-[#52b274]">{title}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleReportPost}>
                    <Ban className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div>
                  <span
                    className="font-semibold text-[#52b274] cursor-pointer hover:underline"
                    onClick={handleRedirectToProfile}
                  >
                    {name}
                  </span>
                  <span className="text-muted-foreground text-sm ml-2">
                    {parsedCreated}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xl font-bold">
              <span className="text-[#52b274]">{postActions ? postActions.length : '0'}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col text-base">
          {hasVoted && (
            <Alert className="mb-3 bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-700 text-sm">
                ✓ You have already {getUserVoteType() === 'up' ? 'upvoted' : 'downvoted'} this post
              </AlertDescription>
            </Alert>
          )}

          <VotingBoard
            content={text}
            onSelect={setSelectedText}
            selectedText={selectedText}
            highlights
            votes={post.votes || post.votedBy}
          >
            {({ text: boardText }: { text: string }) => (
              <VotingPopup
                onVote={handleVoting}
                onAddComment={handleAddComment}
                onAddQuote={handleAddQuote}
                text={boardText}
                selectedText={selectedText}
                votedBy={serializeVotedBy(post.votedBy)}
                hasVoted={hasVoted}
                userVoteType={getUserVoteType()}
              />
            )}
          </VotingBoard>
        </CardContent>

        {user._id === userId && !post.enable_voting && (
          <div className="flex items-center space-x-2 px-6 pb-2">
            <Switch
              id="enable-voting"
              checked={post.enable_voting}
              onCheckedChange={handleToggleVoting}
            />
            <Label htmlFor="enable-voting">Enable Voting</Label>
          </div>
        )}

        <CardFooter className="flex justify-between items-center border-t pt-4">
          {post.enable_voting && (
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <RejectButton
                        onClick={handleRejectPost}
                        selected={hasRejected}
                        count={post.rejectedBy ? post.rejectedBy.length : 0}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="whitespace-pre-line">
                      {getTooltipContent(post.rejectedBy, 'rejected')}
                    </div>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ApproveButton
                        onClick={handleApprovePost}
                        selected={hasApproved}
                        count={post.approvedBy ? post.approvedBy.length : 0}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="whitespace-pre-line">
                      {getTooltipContent(post.approvedBy, 'approved')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          <div className="flex gap-2">
            <FollowButton
              isFollowing={isFollowing}
              profileUserId={userId}
              username={username}
              showIcon
            />
            <BookmarkIconButton post={post} user={user} />
            {(user._id === userId || user.admin) && (
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showCopyAlert} onOpenChange={setShowCopyAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post URL copied!</AlertDialogTitle>
            <AlertDialogDescription>
              The post URL has been copied to your clipboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RequestInviteDialog
        open={openInvite}
        onClose={() => setOpenInvite(false)}
      />
    </>
  );
}
