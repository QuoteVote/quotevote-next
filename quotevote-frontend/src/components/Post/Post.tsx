'use client'

import { useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { includes } from 'lodash'
import moment from 'moment'
import { useMutation, useQuery } from '@apollo/client/react'
import type { Reference } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Link2,
  Ban,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  ArrowLeft,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import AvatarDisplay from '@/components/Avatar'
import { FollowButton } from '../CustomButtons/FollowButton'
import { BookmarkIconButton } from '../CustomButtons/BookmarkIconButton'
import {
  ADD_COMMENT,
  ADD_QUOTE,
  REPORT_POST,
  VOTE,
  APPROVE_POST,
  REJECT_POST,
  DELETE_POST,
  TOGGLE_VOTING,
} from '@/graphql/mutations'
import {
  GET_POST,
  GET_TOP_POSTS,
  GET_USER_ACTIVITY,
  GET_USERS,
} from '@/graphql/queries'
import useGuestGuard from '@/hooks/useGuestGuard'
import { cn } from '@/lib/utils'
import VotingBoard from '@/components/VotingComponents/VotingBoard'
const VotingPopup = lazy(() => import('@/components/VotingComponents/VotingPopup'))
import type { PostVote, PostProps } from '@/types/post'
import type { SelectedText, VotedByEntry, VoteType, VoteOption } from '@/types/voting'

export default function Post({
  post,
  user,
  postHeight,
  postActions,
  refetchPost,
}: PostProps) {
  const router = useRouter()
  const ensureAuth = useGuestGuard()

  const { title, creator, created, _id, userId } = post
  const { name, avatar, username } = creator || {}
  const { _followingId = [] } = user

  const [selectedText, setSelectedText] = useState<SelectedText>({
    text: '',
    startIndex: 0,
    endIndex: 0,
    points: 0,
  })

  const isFollowing = includes(_followingId, userId)
  const admin = user.admin || false

  useQuery<{
    users?: Array<{ _id: string; username: string }>
  }>(GET_USERS, {
    skip: !admin,
    errorPolicy: 'all',
  })

  const [toggleVoting] = useMutation(TOGGLE_VOTING, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '', interactions: false } },
    ],
  })

  const [addVote] = useMutation(VOTE, {
    update() { refetchPost?.() },
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  })

  const [addComment] = useMutation(ADD_COMMENT, {
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  })

  const [addQuote] = useMutation(ADD_QUOTE, {
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_USER_ACTIVITY,
        variables: {
          limit: 15, offset: 0, searchKey: '',
          activityEvent: ['POSTED', 'VOTED', 'COMMENTED', 'QUOTED', 'LIKED'],
          user_id: user._id || '', startDateRange: '', endDateRange: '',
        },
      },
    ],
  })

  const [reportPost] = useMutation<{ reportPost: { _id: string; reportedBy: string[] } }>(REPORT_POST, {
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  })

  const [approvePost] = useMutation(APPROVE_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '', interactions: false } },
    ],
  })

  const [rejectPost] = useMutation(REJECT_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '', interactions: false } },
    ],
  })

  const [deletePost] = useMutation<{ deletePost: { _id: string } }>(DELETE_POST, {
    update(cache, { data }) {
      if (!data?.deletePost) return
      const deletedId = data.deletePost._id
      cache.modify({
        fields: {
          posts(existing: unknown = {}, { readField }) {
            const obj = existing as { entities?: Reference[] }
            if (!obj.entities) return existing
            return { ...obj, entities: obj.entities.filter((ref) => readField('_id', ref) !== deletedId) }
          },
          featuredPosts(existing: unknown = {}, { readField }) {
            const obj = existing as { entities?: Reference[] }
            if (!obj.entities) return existing
            return { ...obj, entities: obj.entities.filter((ref) => readField('_id', ref) !== deletedId) }
          },
        },
      })
      cache.evict({ id: cache.identify({ __typename: 'Post', _id: deletedId }) })
      cache.gc()
    },
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '', interactions: false } },
    ],
  })

  const userIdStr = user._id?.toString()
  const hasApproved = Array.isArray(post.approvedBy) && post.approvedBy.some((id) => id?.toString() === userIdStr)
  const hasRejected = Array.isArray(post.rejectedBy) && post.rejectedBy.some((id) => id?.toString() === userIdStr)
  const votedBy = (post.votes || []) as PostVote[]
  const hasVoted = Array.isArray(votedBy) && votedBy.some(
    (v) => v.user?._id?.toString() === userIdStr && !(v as { deleted?: boolean }).deleted
  )

  const getUserVoteType = () => {
    if (!hasVoted) return null
    const userVote = votedBy.find(
      (v) => v.user?._id?.toString() === userIdStr && !(v as { deleted?: boolean }).deleted
    )
    return userVote ? userVote.type : null
  }

  const handleVoting = async (obj: { type: VoteType; tags: VoteOption }) => {
    if (!ensureAuth()) return
    if (hasVoted) { toast('You have already voted on this post'); return }
    try {
      await addVote({
        variables: {
          vote: {
            content: selectedText.text || '',
            postId: post._id, userId: user._id,
            type: obj.type, tags: obj.tags,
            startWordIndex: selectedText.startIndex, endWordIndex: selectedText.endIndex,
          },
        },
      })
      toast.success('Voted successfully')
    } catch (err) { toast.error(`Vote error: ${err instanceof Error ? err.message : 'Unknown'}`) }
  }

  const handleAddComment = async (comment: string, commentWithQuote = false) => {
    if (!ensureAuth()) return
    try {
      await addComment({
        variables: {
          comment: {
            userId: user._id, content: comment,
            startWordIndex: selectedText.startIndex, endWordIndex: selectedText.endIndex,
            postId: _id, url: post.url,
            quote: commentWithQuote ? selectedText.text : '',
          },
        },
      })
      toast.success('Comment added')
    } catch (err) { toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown'}`) }
  }

  const handleAddQuote = async () => {
    if (!ensureAuth()) return
    try {
      await addQuote({
        variables: {
          quote: {
            quote: selectedText.text, postId: post._id,
            quoter: user._id, quoted: userId,
            startWordIndex: selectedText.startIndex, endWordIndex: selectedText.endIndex,
          },
        },
      })
      toast.success('Quoted successfully')
    } catch (err) { toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown'}`) }
  }

  const handleApprove = async () => {
    if (!ensureAuth()) return
    try {
      if (hasApproved) {
        await approvePost({ variables: { postId: _id, userId: user._id, remove: true } })
        toast.success('Approval removed')
      } else {
        await approvePost({ variables: { postId: _id, userId: user._id } })
        toast.success('Post approved')
      }
    } catch (err) { toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown'}`) }
  }

  const handleReject = async () => {
    if (!ensureAuth()) return
    try {
      if (hasRejected) {
        await rejectPost({ variables: { postId: _id, userId: user._id, remove: true } })
        toast.success('Rejection removed')
      } else {
        await rejectPost({ variables: { postId: _id, userId: user._id } })
        toast.success('Post rejected')
      }
    } catch (err) { toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown'}`) }
  }

  const handleReport = async () => {
    if (!ensureAuth()) return
    try {
      const res = await reportPost({ variables: { postId: _id, userId: user._id } })
      toast.success(`Post reported (${res.data?.reportPost?.reportedBy?.length || 1} total)`)
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Unknown error') }
  }

  const handleDelete = async () => {
    try {
      await deletePost({ variables: { postId: _id } })
      toast.success('Post deleted')
      router.push('/dashboard/explore')
    } catch (err) { toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown'}`) }
  }

  const handleCopy = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    await navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  const approveCount = post.approvedBy?.length || 0
  const rejectCount = post.rejectedBy?.length || 0

  return (
    <div className="px-4 py-4" role="article" aria-label={title || 'Post'}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 -ml-1 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* Author header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => username && router.push(`/dashboard/profile/${username}`)}
            className="flex-shrink-0"
          >
            <Avatar className="size-12">
              <AvatarImage src={typeof avatar === 'string' ? avatar : undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                <AvatarDisplay
                  size={48}
                  src={typeof avatar === 'string' ? avatar : undefined}
                  alt={name || username || ''}
                  fallback={name || username || ''}
                />
              </AvatarFallback>
            </Avatar>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => username && router.push(`/dashboard/profile/${username}`)}
                className="text-[15px] font-bold text-foreground hover:underline"
              >
                {name || username}
              </button>
              <span className="text-sm text-muted-foreground">@{username}</span>
            </div>
            <time className="text-sm text-muted-foreground" suppressHydrationWarning>
              {moment(created).format('MMM D, YYYY · h:mm A')}
            </time>
          </div>
        </div>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full" aria-label="More options">
              <MoreHorizontal className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleCopy}>
              <Link2 className="size-4 mr-2" /> Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive">
              <Ban className="size-4 mr-2" /> Report post
            </DropdownMenuItem>
            {(user._id === userId || user.admin) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="size-4 mr-2" /> Delete post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-foreground leading-tight mb-3">
        {title}
      </h1>

      {/* Vote status */}
      {hasVoted && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 rounded-lg px-3 py-2 mb-3">
          {getUserVoteType() === 'up' ? (
            <ThumbsUp className="size-4" />
          ) : (
            <ThumbsDown className="size-4" />
          )}
          You {getUserVoteType() === 'up' ? 'upvoted' : 'downvoted'} this post
        </div>
      )}

      {/* Post body with text selection */}
      <div className={cn(
        'text-[15px] leading-relaxed text-foreground/90',
        postHeight && postHeight >= 742 && 'max-h-[60vh] overflow-y-auto'
      )}>
        <VotingBoard
          content={post.text || ''}
          onSelect={setSelectedText}
          highlights={true}
          votes={post.votes || []}
        >
          {(selection) => (
            <Suspense fallback={null}>
              <VotingPopup
                votedBy={(post.votes || []).map((v: PostVote): VotedByEntry => ({
                  userId: v.user?._id || '',
                  type: (v.type as VoteType) || 'up',
                  _id: v._id,
                }))}
                onVote={handleVoting}
                onAddComment={handleAddComment}
                onAddQuote={handleAddQuote}
                selectedText={selection}
                hasVoted={hasVoted}
                userVoteType={getUserVoteType() as VoteType | null}
              />
            </Suspense>
          )}
        </VotingBoard>
      </div>

      {/* Interaction count line */}
      <div className="flex items-center gap-4 py-3 my-3 border-y border-border text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
        <span><strong className="text-foreground">{postActions?.length || 0}</strong> interactions</span>
        <span><strong className="text-foreground">{post.comments?.length || 0}</strong> comments</span>
        <span><strong className="text-foreground">{post.votes?.length || 0}</strong> votes</span>
        <span><strong className="text-foreground">{post.quotes?.length || 0}</strong> quotes</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between py-2 border-b border-border" role="toolbar" aria-label="Post actions">
        <div className="flex items-center gap-1">
          {/* Approve / Support */}
          {post.enable_voting && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleApprove}
                      aria-label="Support this post"
                      className={cn(
                        'gap-1.5 rounded-full',
                        hasApproved && 'text-green-600 bg-green-500/10 hover:bg-green-500/15'
                      )}
                    >
                      <ThumbsUp className="size-[18px]" />
                      <span className="text-sm tabular-nums">{approveCount || ''}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="whitespace-pre-line max-w-xs text-xs">
                    {approveCount ? `${approveCount} approval(s)` : 'Support this post'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReject}
                      aria-label="Disagree with this post"
                      className={cn(
                        'gap-1.5 rounded-full',
                        hasRejected && 'text-red-500 bg-red-500/10 hover:bg-red-500/15'
                      )}
                    >
                      <ThumbsDown className="size-[18px]" />
                      <span className="text-sm tabular-nums">{rejectCount || ''}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="whitespace-pre-line max-w-xs text-xs">
                    {rejectCount ? `${rejectCount} rejection(s)` : 'Disagree with this post'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <FollowButton
            isFollowing={isFollowing}
            profileUserId={userId}
            username={username || ''}
            showIcon
          />
          <BookmarkIconButton
            post={{ _id: post._id, bookmarkedBy: post.bookmarkedBy || undefined }}
            user={{ _id: user._id || '' }}
          />
        </div>
      </div>

      {/* Enable voting toggle (owner only) */}
      {user._id === userId && !post.enable_voting && (
        <div className="flex items-center gap-2 py-3">
          <Checkbox
            checked={post.enable_voting || false}
            onCheckedChange={() => {
              if (!ensureAuth()) return
              toggleVoting({ variables: { postId: _id } }).then(() => {
                toast.success('Voting enabled')
              })
            }}
            id="enable-voting"
          />
          <label htmlFor="enable-voting" className="text-sm text-muted-foreground">
            Enable voting on this post
          </label>
        </div>
      )}
    </div>
  )
}
