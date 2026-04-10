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
import { Separator } from '@/components/ui/separator'
import {
  Link2,
  Ban,
  Trash2,
  ArrowBigUp,
  ArrowBigDown,
  MoreHorizontal,
  ArrowLeft,
  MessageCircle,
  Quote,
  Share2,
  ExternalLink,
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
  postActions: _postActions,
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
  const commentCount = post.comments?.length || 0
  const quoteCount = post.quotes?.length || 0

  return (
    <div className="px-4 sm:px-6 py-5" role="article" aria-label={title || 'Post'}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 -ml-1 transition-colors rounded-lg px-2 py-1 hover:bg-muted/50"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* Author header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => username && router.push(`/dashboard/profile/${username}`)}
            className="flex-shrink-0"
          >
            <Avatar className="size-12 ring-2 ring-background shadow-md">
              <AvatarImage src={typeof avatar === 'string' ? avatar : undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => username && router.push(`/dashboard/profile/${username}`)}
                className="text-[15px] font-bold text-foreground hover:underline"
              >
                {name || username}
              </button>
              <span className="text-sm text-muted-foreground">@{username}</span>
            </div>
            <time className="text-xs text-muted-foreground" suppressHydrationWarning>
              {moment(created).format('MMM D, YYYY · h:mm A')}
            </time>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <FollowButton
            isFollowing={isFollowing}
            profileUserId={userId}
            username={username || ''}
            showIcon
          />
          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9 rounded-full text-muted-foreground" aria-label="More options">
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
      </div>

      {/* Title */}
      <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight mb-1">
        {title}
      </h1>

      {/* Citation URL */}
      {post.citationUrl && (
        <a
          href={post.citationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary px-2.5 py-1 bg-primary/5 rounded-md mb-3 mt-1 transition-colors"
        >
          <ExternalLink className="size-3" />
          {post.citationUrl.replace(/^https?:\/\//, '').split('/')[0]}
        </a>
      )}

      {/* Vote status */}
      {hasVoted && (
        <div
          className="flex items-center gap-2 text-sm rounded-lg px-3.5 py-2.5 mb-4 mt-2 border"
          style={{
            background: getUserVoteType() === 'up' ? 'var(--color-upvote)' : 'var(--color-downvote)',
            borderColor: 'transparent',
            color: '#fff',
            opacity: 0.9,
          }}
        >
          {getUserVoteType() === 'up' ? (
            <ArrowBigUp className="size-5" strokeWidth={1.5} />
          ) : (
            <ArrowBigDown className="size-5" strokeWidth={1.5} />
          )}
          <span className="font-medium">You {getUserVoteType() === 'up' ? 'upvoted' : 'downvoted'} this post</span>
        </div>
      )}

      {/* Post body with text selection */}
      <div className={cn(
        'text-[15px] leading-[1.75] text-foreground/85 mt-3',
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

      {/* Stats bar */}
      <div className="flex items-center gap-5 py-3 mt-4 border-y border-border/60 text-[13px] text-muted-foreground" aria-live="polite" aria-atomic="true">
        <span className="flex items-center gap-1.5">
          <ArrowBigUp className="size-4 text-[var(--color-upvote)]" strokeWidth={1.5} />
          <strong className="text-foreground font-semibold">{approveCount}</strong>
          <ArrowBigDown className="size-4 text-[var(--color-downvote)]" strokeWidth={1.5} />
          <strong className="text-foreground font-semibold">{rejectCount}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5" />
          <strong className="text-foreground font-semibold">{commentCount}</strong> comment{commentCount !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <Quote className="size-3.5" />
          <strong className="text-foreground font-semibold">{quoteCount}</strong> quote{quoteCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Action bar */}
      <div className="flex items-center py-2 -mx-1" role="toolbar" aria-label="Post actions">
        {/* Approve / Reject */}
        {post.enable_voting && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleApprove}
                    aria-label="Upvote this post"
                    className={cn(
                      'gap-1 rounded-md h-9 px-2.5',
                      hasApproved
                        ? 'text-[var(--color-upvote)] bg-[var(--color-upvote)]/10 hover:bg-[var(--color-upvote)]/15'
                        : 'text-muted-foreground hover:text-[var(--color-upvote)] hover:bg-[var(--color-upvote)]/10'
                    )}
                  >
                    <ArrowBigUp className="size-5" strokeWidth={1.5} />
                    <span className="text-sm font-semibold tabular-nums">{approveCount || ''}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{hasApproved ? 'Remove upvote' : 'Upvote this post'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReject}
                    aria-label="Downvote this post"
                    className={cn(
                      'gap-1 rounded-md h-9 px-2.5',
                      hasRejected
                        ? 'text-[var(--color-downvote)] bg-[var(--color-downvote)]/10 hover:bg-[var(--color-downvote)]/15'
                        : 'text-muted-foreground hover:text-[var(--color-downvote)] hover:bg-[var(--color-downvote)]/10'
                    )}
                  >
                    <ArrowBigDown className="size-5" strokeWidth={1.5} />
                    <span className="text-sm font-semibold tabular-nums">{rejectCount || ''}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{hasRejected ? 'Remove downvote' : 'Downvote this post'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-5 mx-1" />
          </>
        )}

        <BookmarkIconButton
          post={{ _id: post._id, bookmarkedBy: post.bookmarkedBy || undefined }}
          user={{ _id: user._id || '' }}
        />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="rounded-full size-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                aria-label="Share"
              >
                <Share2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy link</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Enable voting toggle (owner only) */}
      {user._id === userId && !post.enable_voting && (
        <div className="flex items-center gap-2.5 py-3 px-3 mt-2 bg-muted/30 rounded-lg border border-border/50">
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
          <label htmlFor="enable-voting" className="text-sm text-muted-foreground cursor-pointer">
            Enable voting on this post
          </label>
        </div>
      )}
    </div>
  )
}
