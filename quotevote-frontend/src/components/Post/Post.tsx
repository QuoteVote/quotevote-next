'use client'

import { useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { includes } from 'lodash'
import moment from 'moment'
import { useMutation, useQuery } from '@apollo/client/react'
import type { Reference } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  ExternalLink,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { DisplayAvatar } from '@/components/DisplayAvatar'
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
  DELETE_VOTE,
} from '@/graphql/mutations'
import {
  GET_POST,
  GET_TOP_POSTS,
  GET_USER_ACTIVITY,
  GET_USERS,
} from '@/graphql/queries'
import useGuestGuard from '@/hooks/useGuestGuard'
import { cn } from '@/lib/utils'
import { scrollActionIntoDiscussion } from '@/lib/utils/discussionSplit'
import { useAppStore } from '@/store'
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
  onOpenDiscussion,
  onActivateLinkedComment,
}: PostProps) {
  const router = useRouter()
  const ensureAuth = useGuestGuard()
  const linkedPassage = useAppStore((state) => state.ui.linkedPassage)
  const mobileDiscussionOpen = useAppStore((state) => state.ui.mobileDiscussionOpen)

  const handleHighlightClick = () => {
    const actionId = linkedPassage?.actionId
    if (!actionId) {
      onOpenDiscussion?.()
      return
    }
    onActivateLinkedComment?.(actionId)
    // Reverse-nav only when opening Discussion; tapping the highlight while
    // split-screen is already open clears the selection instead.
    if (mobileDiscussionOpen) return
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        scrollActionIntoDiscussion(actionId, 'center')
      }, 220)
    })
  }

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
  const isOwner = user._id === userId

  // Admin-only: fetch user list for enhanced tooltips
  useQuery<{ users?: Array<{ _id: string; username: string }> }>(GET_USERS, {
    skip: !admin,
    errorPolicy: 'all',
  })

  const [addVote] = useMutation(VOTE, {
    update() { refetchPost?.() },
    refetchQueries: [
      { query: GET_TOP_POSTS, variables: { limit: 5, offset: 0, searchKey: '' } },
      { query: GET_POST, variables: { postId: _id } },
    ],
  })

  const [removeVote] = useMutation(DELETE_VOTE, {
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

  const getUserVote = () => {
    if (!hasVoted) return null
    return votedBy.find(
      (v) => v.user?._id?.toString() === userIdStr && !(v as { deleted?: boolean }).deleted
    )
  }

  const getUserVoteType = () => {
    const userVote = getUserVote()
    return userVote ? userVote.type : null
  }

  const handleDeleteVote = async () => {
    if (!ensureAuth()) return
    const userVote = getUserVote()
    if (!userVote) return
    try {
      await removeVote({
        variables: {
          voteId: userVote._id,
        },
      })
      toast.success('Vote removed successfully')
    } catch (err) {
      toast.error(`Error removing vote: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }

  const handleVoting = async (obj: { type: VoteType; tags: VoteOption }) => {
    if (!ensureAuth()) return
    const userVote = getUserVote()
    try {
      if (userVote) {
        if (userVote.type === obj.type) {
          await handleDeleteVote()
          return
        }
        // Switch vote: synchronously delete existing vote first
        await removeVote({
          variables: {
            voteId: userVote._id,
          },
        })
      }
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
    if (!comment.trim()) {
      toast.error('Please enter a comment')
      return
    }
    try {
      await addComment({
        variables: {
          comment: {
            userId: user._id, content: comment.trim(),
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
      router.push('/')
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
  const voteCount = post.votes?.length || 0
  const interactionCount = commentCount + quoteCount + voteCount

  return (
    <div className="flex flex-col" role="article" aria-label={title || 'Post'}>

      {/* ── Non-sticky header area ──────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-5 pb-3">

        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 -ml-1 transition-colors rounded-lg px-2 py-1 hover:bg-muted/50"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        {/* Author row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => username && router.push(`/profile/${username}`)}
              className="shrink-0 rounded-full ring-2 ring-background shadow-md overflow-hidden"
            >
              <DisplayAvatar
                avatar={avatar as string | Record<string, unknown> | undefined}
                /* Seed the default avatar with the same value the profile/chat
                   use (display name, falling back to username) so an unset
                   avatar looks identical across the post, profile and messages. */
                username={name || username || undefined}
                size={48}
              />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => username && router.push(`/profile/${username}`)}
                  className="text-[15px] font-bold text-foreground hover:underline"
                >
                  {name || username}
                </button>
                <span
                  data-testid="post-op-badge"
                  className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide bg-[#52b274] text-white leading-none"
                  title="Original poster"
                >
                  OP
                </span>
                <span className="text-sm text-muted-foreground">@{username}</span>
              </div>
              <time className="text-xs text-muted-foreground" suppressHydrationWarning>
                {moment(created).format('MMM D, YYYY · h:mm A')}
              </time>
            </div>
          </div>

          {/* Secondary actions: copy link + report (no delete — that's in the sticky bar) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full text-muted-foreground"
                aria-label="More options"
              >
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleCopy}>
                <Link2 className="size-4 mr-2" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive">
                <Ban className="size-4 mr-2" /> Report post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <h1
          data-testid="post-detail-title"
          className="text-base sm:text-lg font-bold text-foreground leading-tight mb-1"
        >
          {title}
        </h1>

        {/* Citation URL */}
        {post.citationUrl && (
          <a
            href={post.citationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary/80 hover:text-primary px-2.5 py-1 bg-primary/5 rounded-md mt-1 transition-colors"
          >
            <ExternalLink className="size-3" />
            {post.citationUrl.replace(/^https?:\/\//, '').split('/')[0]}
          </a>
        )}
      </div>

      {/* ── Action bar: sticky while reading; scrolls with the quote in split view ── */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 sm:px-6 py-2 border-y border-border/60',
          mobileDiscussionOpen
            ? 'relative bg-background'
            : 'sticky top-0 z-10 bg-background/80 backdrop-blur-sm',
        )}
        role="toolbar"
        aria-label="Post actions"
      >
        <div className="flex items-center gap-1 flex-wrap">
          {/* ponytail: RC1-012 — Disagree=red, Support=dark green */}
          <Button
            size="sm"
            onClick={handleReject}
            aria-label={hasRejected ? 'Remove downvote' : 'Downvote this post'}
            className={cn(
              'rounded-xl font-bold text-xs h-8 border',
              hasRejected
                ? 'bg-disagree border-disagree text-white hover:bg-disagree-hover'
                : 'bg-transparent border-disagree/40 text-disagree hover:bg-disagree/5 hover:border-disagree'
            )}
          >
            Disagree{rejectCount > 0 ? ` (${rejectCount})` : ''}
          </Button>
          <Button
            size="sm"
            onClick={handleApprove}
            aria-label={hasApproved ? 'Remove upvote' : 'Upvote this post'}
            className={cn(
              'rounded-xl font-bold text-xs h-8 border',
              hasApproved
                ? 'bg-agree border-agree text-white hover:bg-agree-hover'
                : 'bg-transparent border-agree/40 text-agree hover:bg-agree/5 hover:border-agree'
            )}
          >
            Agree{approveCount > 0 ? ` (${approveCount})` : ''}
          </Button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {!isOwner && (
            <FollowButton
              isFollowing={isFollowing}
              profileUserId={userId}
              username={username || ''}
              showIcon
            />
          )}

          <BookmarkIconButton
            post={{ _id: post._id, bookmarkedBy: post.bookmarkedBy || undefined }}
            user={{ _id: user._id || '' }}
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="flex items-center gap-1 px-2 h-8 rounded-md bg-muted/40 text-[12px] text-muted-foreground"
                  aria-label={`${approveCount} support, ${rejectCount} disagree`}
                >
                  <ArrowBigUp className="size-3.5 text-[var(--color-upvote)]" strokeWidth={1.5} />
                  <strong className="text-foreground font-semibold tabular-nums">{approveCount}</strong>
                  <span className="text-muted-foreground/30 mx-0.5">/</span>
                  <ArrowBigDown className="size-3.5 text-[var(--color-downvote)]" strokeWidth={1.5} />
                  <strong className="text-foreground font-semibold tabular-nums">{rejectCount}</strong>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {approveCount} support · {rejectCount} disagree
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {onOpenDiscussion ? (
                  <button
                    type="button"
                    onClick={onOpenDiscussion}
                    className="flex items-center gap-1 px-2 h-8 rounded-md bg-muted/40 text-[12px] text-muted-foreground hover:bg-muted/70 transition-colors"
                    aria-label={`${interactionCount} interaction${interactionCount !== 1 ? 's' : ''}`}
                    data-testid="post-comment-count"
                  >
                    <MessageCircle className="size-3.5" />
                    <strong className="text-foreground font-semibold tabular-nums">{interactionCount}</strong>
                  </button>
                ) : (
                  <span
                    className="flex items-center gap-1 px-2 h-8 rounded-md bg-muted/40 text-[12px] text-muted-foreground"
                    aria-label={`${interactionCount} interaction${interactionCount !== 1 ? 's' : ''}`}
                    data-testid="post-comment-count"
                  >
                    <MessageCircle className="size-3.5" />
                    <strong className="text-foreground font-semibold tabular-nums">{interactionCount}</strong>
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {(isOwner || admin) && (
            <>
              <Separator orientation="vertical" className="h-5 mx-0.5" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDelete}
                      className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete post"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Delete post</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </div>

      {/* ── Post body ───────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4">
        {/* Selectable post text + floating VotingPopup */}

        <div
          data-testid="post-detail-body"
          className={cn(
          'text-[15px] leading-[1.75] text-foreground/85',
          postHeight && postHeight >= 742 && 'max-h-[60vh] overflow-y-auto'
        )}>
          <VotingBoard
            content={post.text || ''}
            onSelect={setSelectedText}
            highlights={true}
            votes={post.votes || []}
            focusedComment={linkedPassage}
            onHighlightClick={handleHighlightClick}
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
                  onDeleteVote={handleDeleteVote}
                />
              </Suspense>
            )}
          </VotingBoard>
        </div>
      </div>

    </div>
  )
}
