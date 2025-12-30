'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@apollo/client/react'
import { get } from 'lodash'
import { Link2, Trash2 } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Avatar from '@/components/Avatar'
import CommentReactions from '@/components/Comment/CommentReactions'
import PostChatMessage from '@/components/PostChat/PostChatMessage'
import { Like } from '@/components/Icons/Like'
import { Dislike } from '@/components/Icons/Dislike'
import { parseCommentDate } from '@/lib/utils/momentUtils'
import { useAppStore } from '@/store'
import { DELETE_VOTE, DELETE_COMMENT, DELETE_QUOTE } from '@/graphql/mutations'
import { GET_ACTION_REACTIONS } from '@/graphql/queries'
import { cn } from '@/lib/utils'
import type {
  PostActionCardProps,
  ActionReactionsData,
  DeleteVoteData,
  DeleteCommentData,
  DeleteQuoteData,
} from '@/types/postActions'

export default function PostActionCard({
  postAction,
  postUrl = '',
  selected = false,
  refetchPost,
}: PostActionCardProps) {
  const [commentSelected, setCommentSelected] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const user = useAppStore((state) => state.user.data)
  const setSnackbar = useAppStore((state) => state.setSnackbar)
  const setFocusedComment = useAppStore((state) => state.setFocusedComment)
  const setSharedComment = useAppStore((state) => state.setSharedComment)
  const sharedComment = useAppStore((state) => state.ui.sharedComment)

  const { user: actionUser, content, created, _id } = postAction
  const { username, avatar, name } = actionUser || {}
  const parsedDate = parseCommentDate(new Date(created))
  const voteType = get(postAction, 'type') as string | undefined
  const quote = get(postAction, 'quote') as string | undefined
  const type = postAction.__typename

  const { loading, data } = useQuery<ActionReactionsData>(GET_ACTION_REACTIONS, {
    variables: { actionId: _id },
  })

  const actionReactions = (!loading && data?.actionReactions) || []

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${baseUrl}${postUrl}/comment#${_id}`)
      setOpen(true)
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to copy link',
        type: 'danger',
      })
    }
  }

  const hideAlert = () => {
    setOpen(false)
  }

  const [deleteVote] = useMutation<DeleteVoteData>(DELETE_VOTE, {
    update(cache, { data: mutationData }) {
      if (!mutationData?.deleteVote) return
      cache.modify({
        fields: {
          votes(existing: readonly { __ref: string }[] = [], { readField }) {
            return existing.filter(
              (voteRef) => readField('_id', voteRef) !== mutationData.deleteVote._id,
            )
          },
        },
      })
    },
  })

  const [deleteComment] = useMutation<DeleteCommentData>(DELETE_COMMENT, {
    update(cache, { data: mutationData }) {
      if (!mutationData?.deleteComment) return
      cache.modify({
        fields: {
          comments(existing: readonly { __ref: string }[] = [], { readField }) {
            return existing.filter(
              (commentRef) => readField('_id', commentRef) !== mutationData.deleteComment._id,
            )
          },
        },
      })
    },
  })

  const [deleteQuote] = useMutation<DeleteQuoteData>(DELETE_QUOTE, {
    update(cache, { data: mutationData }) {
      if (!mutationData?.deleteQuote) return
      cache.modify({
        fields: {
          quotes(existing: readonly { __ref: string }[] = [], { readField }) {
            return existing.filter(
              (quoteRef) => readField('_id', quoteRef) !== mutationData.deleteQuote._id,
            )
          },
        },
      })
    },
  })

  const handleDelete = async () => {
    try {
      if (type === 'Vote') {
        await deleteVote({ variables: { voteId: _id } })
        setSnackbar({
          open: true,
          message: 'Vote deleted successfully',
          type: 'success',
        })
        if (refetchPost) refetchPost()
      } else if (type === 'Comment') {
        await deleteComment({ variables: { commentId: _id } })
        setSnackbar({
          open: true,
          message: 'Comment deleted successfully',
          type: 'success',
        })
        if (refetchPost) refetchPost()
      } else if (type === 'Quote') {
        await deleteQuote({ variables: { quoteId: _id } })
        setSnackbar({
          open: true,
          message: 'Quote deleted successfully',
          type: 'success',
        })
        if (refetchPost) refetchPost()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setSnackbar({
        open: true,
        message: `Delete Error: ${errorMessage}`,
        type: 'danger',
      })
    }
  }

  const handleClick = useCallback(() => {
    if (!commentSelected) {
      setFocusedComment(_id)
      setCommentSelected(true)
    } else {
      setFocusedComment(sharedComment)
      setCommentSelected(false)
    }
  }, [commentSelected, _id, sharedComment, setFocusedComment])

  const handleRedirectToProfile = () => {
    if (username) {
      router.push(`/Profile/${username}`)
    }
  }

  // Determine vote icon and tags
  let svgIcon: React.ReactNode = null
  let voteTags = ''
  if (voteType) {
    const isUpvote = voteType === 'up' || voteType === 'upvote'
    const defaultTag = isUpvote ? '#agree' : '#disagree'
    svgIcon = isUpvote ? <Like size={24} /> : <Dislike size={24} />
    const tags = get(postAction, 'tags')
    voteTags = Array.isArray(tags) && tags.length > 0 ? tags.join(' ') : defaultTag
  }

  // Determine content to display
  let postContent = content
  if (quote) {
    postContent = quote.length ? quote : 'Quoted this post.'
  }

  useEffect(() => {
    if (selected) {
      setSharedComment(_id)
      setFocusedComment(_id)
    }
  }, [selected, _id, setFocusedComment, setSharedComment])

  // If this is a PostChat message (has text property), render PostChatMessage
  if ('text' in postAction && postAction.text) {
    const messageText = typeof postAction.text === 'string' ? postAction.text : ''
    return (
      <PostChatMessage
        message={{
          _id: postAction._id,
          userId: (postAction as { userId?: string }).userId || '',
          text: messageText,
          created: typeof created === 'string' ? created : created.toISOString(),
          user: {
            username: username,
            name: name || username || 'Unknown',
            avatar: typeof avatar === 'string' ? avatar : undefined,
          },
        }}
      />
    )
  }

  const userId = user?._id || user?.id
  const isOwner = userId === actionUser?._id || user?.admin
  const avatarSrc = typeof avatar === 'string' ? avatar : undefined
  const displayName = name || username || 'Unknown'

  return (
    <>
      <Card
        onClick={handleClick}
        className={cn(
          'w-full cursor-pointer transition-colors',
          selected ? 'bg-amber-50 dark:bg-amber-950' : 'bg-white dark:bg-gray-900',
        )}
      >
        {/* User info section */}
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRedirectToProfile()
              }}
              className="shrink-0"
            >
              <Avatar
                src={avatarSrc}
                alt={displayName}
                size={20}
                fallback={displayName[0]?.toUpperCase() || '?'}
                className="cursor-pointer"
              />
            </button>

            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRedirectToProfile()
                }}
                className="block font-semibold text-green-600 hover:underline"
              >
                {displayName}
                {type === 'Vote' && username && ` ${username}`}
              </button>
              <span className="block text-sm text-gray-500">{parsedDate}</span>
            </div>
          </div>

          {/* Vote content */}
          {type === 'Vote' && (
            <div className="ml-8 mt-2">
              <p className="text-base">
                ❝ {postAction.content || '(no text selected)'} ❞
              </p>
            </div>
          )}

          {/* Comment/Quote content */}
          {!voteType && (
            <div className="ml-8 mt-2">
              <p className="text-base">
                {type === 'Quote' && '❝ '}
                {postContent}
                {type === 'Quote' && ' ❞'}
              </p>
              {type === 'Comment' && 'commentQuote' in postAction && postAction.commentQuote && (
                <p className="mt-1 text-base">
                  ❝ {postAction.commentQuote} ❞
                </p>
              )}
            </div>
          )}
        </CardContent>

        {/* Actions footer */}
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center gap-2">
            {svgIcon && (
              <div className="flex items-center gap-2">
                {svgIcon}
                {voteTags && <span className="text-sm">{voteTags}</span>}
              </div>
            )}
            <div className="ml-auto">
              <CommentReactions actionId={_id} reactions={actionReactions} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
              className="h-8 w-8"
            >
              <Link2 className="h-4 w-4" />
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
                className="h-8 w-8 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Copy success dialog */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link copied!</DialogTitle>
              <DialogDescription>
                The link has been copied to your clipboard.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={hideAlert} className="mt-4">
              OK
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

