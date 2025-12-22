'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { includes } from 'lodash'
import moment from 'moment'
import { useMutation, useQuery } from '@apollo/client/react'
import type { Reference } from '@apollo/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Link2, Ban, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store'
import AvatarDisplay from '@/components/Avatar'
import { ApproveButton } from '../CustomButtons/ApproveButton'
import { RejectButton } from '../CustomButtons/RejectButton'
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
import type { Post, PostVote, PostProps } from '@/types/post'

/**
 * TODO: VotingBoard and VotingPopup components need to be migrated separately.
 * These components handle text selection and voting functionality.
 * For now, displaying post text without voting highlights.
 */
function VotingBoardPlaceholder({
  content,
  children,
}: {
  content: string
  children?: (props: { text: string }) => React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="prose max-w-none text-base leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
      {children && children({ text: content })}
    </div>
  )
}

function VotingPopupPlaceholder({
  onVote: _onVote,
  onAddComment: _onAddComment,
  onAddQuote: _onAddQuote,
  hasVoted: _hasVoted,
}: {
  onVote: (obj: { type: string; tags?: string[] }) => void
  onAddComment: (comment: string, withQuote?: boolean) => void
  onAddQuote: () => void
  hasVoted: boolean
}) {
  // Placeholder - actual VotingPopup needs to be migrated
  // These props are intentionally unused until VotingPopup is migrated
  void _onVote
  void _onAddComment
  void _onAddQuote
  void _hasVoted
  return null
}

export default function Post({
  post,
  user,
  postHeight,
  postActions,
  refetchPost,
}: PostProps) {
  const router = useRouter()
  const setSnackbar = useAppStore((state) => state.setSnackbar)
  const ensureAuth = useGuestGuard()

  const { title, creator, created, _id, userId } = post
  const { name, avatar, username } = creator || {}
  const { _followingId = [] } = user
  const parsedCreated = moment(created).format('LLL')

  // selectedText is used in handlers, but setSelectedText is not used until VotingBoard is migrated
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedText, _setSelectedText] = useState<{
    text: string
    startIndex: number
    endIndex: number
  }>({
    text: '',
    startIndex: 0,
    endIndex: 0,
  })
  const [open, setOpen] = useState(false)
  const [openInvite, setOpenInvite] = useState(false)

  const isFollowing = includes(_followingId, userId)

  // Get admin status from user state
  const admin = user.admin || false

  // Query to get user details for tooltips (admin only)
  const { loading: usersLoading, data: usersData, error: usersError } = useQuery<{
    users?: Array<{ _id: string; username: string }>
  }>(GET_USERS, {
    skip: !admin,
    errorPolicy: 'all',
  })

  const getRejectTooltipContent = () => {
    if (!post.rejectedBy || post.rejectedBy.length === 0) {
      return 'No users rejected this post.'
    }

    if (!admin) {
      return `${post.rejectedBy.length} user(s) rejected this post.`
    }

    if (usersLoading || !usersData) {
      return 'Loading...'
    }

    if (usersError) {
      return 'Unable to load user details.'
    }

    const rejectedUsers = (usersData.users || []).filter((u) =>
      post.rejectedBy?.includes(u._id)
    )

    if (rejectedUsers.length === 0) {
      return 'No users rejected this post.'
    }

    const MAX_DISPLAY = 5
    const displayUsers = rejectedUsers.slice(0, MAX_DISPLAY)
    const remaining = rejectedUsers.length - MAX_DISPLAY

    let content = `Users who rejected this post:\n`
    displayUsers.forEach((u) => {
      content += `• @${u.username}\n`
    })

    if (remaining > 0) {
      content += `\n... and ${remaining} more`
    }

    return content
  }

  const getApproveTooltipContent = () => {
    if (!post.approvedBy || post.approvedBy.length === 0) {
      return 'No users approved this post.'
    }

    if (!admin) {
      return `${post.approvedBy.length} user(s) approved this post.`
    }

    if (usersLoading || !usersData) {
      return 'Loading...'
    }

    if (usersError) {
      return 'Unable to load user details.'
    }

    const approvedUsers = (usersData.users || []).filter((u) =>
      post.approvedBy?.includes(u._id)
    )

    if (approvedUsers.length === 0) {
      return 'No users approved this post.'
    }

    const MAX_DISPLAY = 5
    const displayUsers = approvedUsers.slice(0, MAX_DISPLAY)
    const remaining = approvedUsers.length - MAX_DISPLAY

    let content = `Users who approved this post:\n`
    displayUsers.forEach((u) => {
      content += `• @${u.username}\n`
    })

    if (remaining > 0) {
      content += `\n... and ${remaining} more`
    }

    return content
  }

  const [toggleVoting] = useMutation(TOGGLE_VOTING, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '', interactions: false },
      },
    ],
  })

  const handleToggleVoteButtons = async () => {
    if (!ensureAuth()) return
    try {
      await toggleVoting({ variables: { postId: _id } })
      setSnackbar({
        open: true,
        message: post.enable_voting ? 'Voting disabled' : 'Voting enabled',
        type: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Toggle voting error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'danger',
      })
    }
  }

  const [addVote] = useMutation(VOTE, {
    update() {
      refetchPost?.()
    },
    refetchQueries: [
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '' },
      },
      {
        query: GET_POST,
        variables: { postId: _id },
      },
    ],
  })

  const [addComment] = useMutation(ADD_COMMENT, {
    refetchQueries: [
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '' },
      },
      {
        query: GET_POST,
        variables: { postId: _id },
      },
    ],
  })

  const [addQuote] = useMutation(ADD_QUOTE, {
    refetchQueries: [
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '' },
      },
      {
        query: GET_POST,
        variables: { postId: _id },
      },
      {
        query: GET_USER_ACTIVITY,
        variables: {
          limit: 15,
          offset: 0,
          searchKey: '',
          activityEvent: ['POSTED', 'VOTED', 'COMMENTED', 'QUOTED', 'LIKED'],
          user_id: user._id || '',
          startDateRange: '',
          endDateRange: '',
        },
      },
    ],
  })

  const [reportPost] = useMutation<{ reportPost: { _id: string; reportedBy: string[] } }>(
    REPORT_POST,
    {
      refetchQueries: [
        {
          query: GET_TOP_POSTS,
          variables: { limit: 5, offset: 0, searchKey: '' },
        },
        {
          query: GET_POST,
          variables: { postId: _id },
        },
      ],
    }
  )

  const [approvePost] = useMutation(APPROVE_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '', interactions: false },
      },
    ],
  })

  const [rejectPost] = useMutation(REJECT_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '', interactions: false },
      },
    ],
  })

  const userIdStr = user._id?.toString()
  const hasApproved =
    Array.isArray(post.approvedBy) &&
    post.approvedBy.some((id) => id?.toString() === userIdStr)
  const hasRejected =
    Array.isArray(post.rejectedBy) &&
    post.rejectedBy.some((id) => id?.toString() === userIdStr)

  // Check if user has already voted (ignore deleted votes)
  const votedBy = (post.votes || []) as PostVote[]
  const hasVoted =
    Array.isArray(votedBy) &&
    votedBy.some(
      (vote) => vote.user?._id?.toString() === userIdStr && !(vote as { deleted?: boolean }).deleted
    )

  const getUserVoteType = () => {
    if (!hasVoted) return null
    const userVote = votedBy.find(
      (vote) => vote.user?._id?.toString() === userIdStr && !(vote as { deleted?: boolean }).deleted
    )
    return userVote ? userVote.type : null
  }

  const [removeApprove] = useMutation(APPROVE_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '', interactions: false },
      },
    ],
  })

  const [removeReject] = useMutation(REJECT_POST, {
    refetchQueries: [
      { query: GET_POST, variables: { postId: _id } },
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '', interactions: false },
      },
    ],
  })

  const [deletePost] = useMutation<{ deletePost: { _id: string } }>(DELETE_POST, {
    update(cache, { data }) {
      if (!data?.deletePost) return
      const deletedPostId = data.deletePost._id
      cache.modify({
        fields: {
          posts(existing: unknown = {}, { readField }) {
            const existingObj = existing as { entities?: Reference[] }
            if (!existingObj.entities) return existing
            return {
              ...existingObj,
              entities: existingObj.entities.filter(
                (postRef) => readField('_id', postRef as Reference) !== deletedPostId
              ),
            }
          },
          featuredPosts(existing: unknown = {}, { readField }) {
            const existingObj = existing as { entities?: Reference[] }
            if (!existingObj.entities) return existing
            return {
              ...existingObj,
              entities: existingObj.entities.filter(
                (postRef) => readField('_id', postRef as Reference) !== deletedPostId
              ),
            }
          },
        },
      })
      cache.evict({
        id: cache.identify({ __typename: 'Post', _id: deletedPostId }),
      })
      cache.gc()
    },
    refetchQueries: [
      {
        query: GET_TOP_POSTS,
        variables: { limit: 5, offset: 0, searchKey: '', interactions: false },
      },
    ],
  })

  const handleReportPost = async () => {
    if (!ensureAuth()) return
    try {
      const res = await reportPost({
        variables: { postId: _id, userId: user._id },
      })
      const reportedBy = res.data?.reportPost?.reportedBy || []
      const reported = reportedBy.length
      setSnackbar({
        open: true,
        message: `Post Reported. Total Reports: ${reported}`,
        type: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Unknown error',
        type: 'danger',
      })
    }
  }

  const handleAddComment = async (comment: string, commentWithQuote = false) => {
    if (!ensureAuth()) return
    const startIndex = selectedText.startIndex
    const endIndex = selectedText.endIndex
    const quoteText = selectedText.text

    const newComment = {
      userId: user._id,
      content: comment,
      startWordIndex: startIndex,
      endWordIndex: endIndex,
      postId: _id,
      url: post.url,
      quote: commentWithQuote ? quoteText : '',
    }

    try {
      await addComment({ variables: { comment: newComment } })
      setSnackbar({
        open: true,
        message: 'Commented Successfully',
        type: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Comment Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'danger',
      })
    }
  }

  const handleVoting = async (obj: { type: string; tags?: string[] }) => {
    if (!ensureAuth()) return
    if (hasVoted) {
      setSnackbar({
        open: true,
        message: 'You have already voted on this post',
        type: 'warning',
      })
      return
    }

    const vote = {
      content: selectedText.text || '',
      postId: post._id,
      userId: user._id,
      type: obj.type,
      tags: obj.tags,
      startWordIndex: selectedText.startIndex,
      endWordIndex: selectedText.endIndex,
    }
    try {
      await addVote({ variables: { vote } })
      setSnackbar({
        open: true,
        message: 'Voted Successfully',
        type: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Vote Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'danger',
      })
    }
  }

  const handleAddQuote = async () => {
    if (!ensureAuth()) return
    const quote = {
      quote: selectedText.text,
      postId: post._id,
      quoter: user._id,
      quoted: userId,
      startWordIndex: selectedText.startIndex,
      endWordIndex: selectedText.endIndex,
    }
    try {
      await addQuote({ variables: { quote } })
      setSnackbar({
        open: true,
        message: 'Quoted Successfully',
        type: 'success',
      })
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Quote Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'danger',
      })
    }
  }

  const handleRedirectToProfile = () => {
    if (username) {
      router.push(`/Profile/${username}`)
    }
  }

  const pointsHeader = (
    <div className="mt-2.5 mr-5 text-xl font-bold font-montserrat">
      <span className="text-[#52b274]">
        {postActions ? postActions.length : '0'}
      </span>
    </div>
  )

  const copyToClipBoard = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
    await navigator.clipboard.writeText(`${baseUrl}${pathname}`)
    setOpen(true)
  }

  const hideAlert = () => {
    setOpen(false)
  }

  const handleApprovePost = async () => {
    if (!ensureAuth()) return
    if (hasApproved) {
      try {
        await removeApprove({
          variables: { postId: _id, userId: user._id, remove: true },
        })
        setSnackbar({
          open: true,
          message: 'Approval removed',
          type: 'success',
        })
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Approve Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          type: 'danger',
        })
      }
    } else {
      try {
        await approvePost({ variables: { postId: _id, userId: user._id } })
        setSnackbar({
          open: true,
          message: 'Post Approved',
          type: 'success',
        })
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Approve Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          type: 'danger',
        })
      }
    }
  }

  const handleRejectPost = async () => {
    if (!ensureAuth()) return
    if (hasRejected) {
      try {
        await removeReject({
          variables: { postId: _id, userId: user._id, remove: true },
        })
        setSnackbar({
          open: true,
          message: 'Rejection removed',
          type: 'success',
        })
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Reject Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          type: 'danger',
        })
      }
    } else {
      try {
        await rejectPost({ variables: { postId: _id, userId: user._id } })
        setSnackbar({
          open: true,
          message: 'Post Rejected',
          type: 'success',
        })
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Reject Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          type: 'danger',
        })
      }
    }
  }

  const handleDelete = async () => {
    try {
      await deletePost({ variables: { postId: _id } })
      setSnackbar({ open: true, message: 'Post deleted', type: 'success' })
      router.push('/search')
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Delete Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        type: 'danger',
      })
    }
  }

  return (
    <>
      <Card
        className={cn(
          'h-full flex flex-col overflow-auto',
          postHeight && postHeight >= 742 && 'sm:h-[83vh]'
        )}
      >
        <CardHeader className="p-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-[#52b274] font-montserrat text-xl mr-1">
                {title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                id="copyBtn"
                onClick={copyToClipBoard}
                className="h-8 w-8 p-0"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReportPost}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              >
                <Ban className="h-4 w-4" />
              </Button>
            </div>
            {pointsHeader}
          </div>
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRedirectToProfile}
                className="cursor-pointer font-semibold text-[#52b274] hover:underline"
              >
                {name || username}
              </button>
              <span className="text-gray-500 text-sm ml-2">{parsedCreated}</span>
            </div>
            <button
              type="button"
              onClick={handleRedirectToProfile}
              className="mt-2"
            >
              <AvatarDisplay size={40} src={typeof avatar === 'string' ? avatar : undefined} alt={name || username || ''} fallback={name || username || ''} />
            </button>
          </div>
        </CardHeader>
        <CardContent
          className="text-base flex-1 flex flex-col"
        >
          {hasVoted && (
            <div className="bg-blue-50 p-3 rounded border border-blue-300 text-blue-700 text-sm mb-3">
              ✓ You have already{' '}
              {getUserVoteType() === 'up' ? 'upvoted' : 'downvoted'} this post
            </div>
          )}
          <VotingBoardPlaceholder content={post.text || ''}>
            {() => (
              <VotingPopupPlaceholder
                onVote={handleVoting}
                onAddComment={handleAddComment}
                onAddQuote={handleAddQuote}
                hasVoted={hasVoted}
              />
            )}
          </VotingBoardPlaceholder>
        </CardContent>

        {user._id === userId && !post.enable_voting && (
          <div className="flex items-center gap-2 ml-5 mb-2">
            <Checkbox
              checked={post.enable_voting || false}
              onCheckedChange={handleToggleVoteButtons}
              id="enable-voting"
            />
            <label
              htmlFor="enable-voting"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Enable Voting
            </label>
          </div>
        )}

        <div className="flex justify-between items-center ml-5 mb-4">
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
                  <TooltipContent className="whitespace-pre-line max-w-xs">
                    {getRejectTooltipContent()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
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
                  <TooltipContent className="whitespace-pre-line max-w-xs">
                    {getApproveTooltipContent()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <div className="flex gap-2">
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
            {(user._id === userId || user.admin) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {open && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Post URL copied!</DialogTitle>
                <DialogDescription>
                  The post URL has been copied to your clipboard.
                </DialogDescription>
              </DialogHeader>
              <Button onClick={hideAlert} className="mt-4">
                OK
              </Button>
            </DialogContent>
          </Dialog>
        )}
        {/* TODO: RequestInviteDialog needs to be migrated or replaced with AuthModalContext */}
        {openInvite && (
          <Dialog open={openInvite} onOpenChange={setOpenInvite}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Authentication Required</DialogTitle>
                <DialogDescription>
                  Please sign in to continue.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </>
  )
}

