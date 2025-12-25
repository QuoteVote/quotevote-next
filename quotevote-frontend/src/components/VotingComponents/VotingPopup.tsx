'use client'

import { useState, useEffect, useCallback } from 'react'
import { isEmpty, findIndex } from 'lodash'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Like } from '@/components/Icons/Like'
import { Dislike } from '@/components/Icons/Dislike'
import { Comment } from '@/components/Icons/Comment'
import { Quote } from '@/components/Icons/Quote'
import { cn } from '@/lib/utils'
import type { VotingPopupProps, VoteType, VoteOption } from '@/types/voting'

/**
 * VotingPopup component
 * Displays voting options (upvote, downvote, comment, quote) when text is selected
 */
export default function VotingPopup({
  votedBy,
  onVote,
  onAddComment,
  onAddQuote,
  selectedText,
  hasVoted,
  userVoteType,
}: VotingPopupProps) {
  const user = useAppStore((state) => state.user.data)
  const [expand, setExpand] = useState<{ open: boolean; type: string }>({
    open: false,
    type: '',
  })
  const [comment, setComment] = useState('')
  const [checkWindowWidth, setCheckWindowWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 400
    }
    return true
  })

  const handleWindowSizeChange = useCallback(() => {
    if (window.innerWidth < 400) {
      setCheckWindowWidth(false)
    } else {
      setCheckWindowWidth(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange)
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange)
    }
  }, [handleWindowSizeChange])

  const voteOptions: VoteOption[] = (() => {
    if (expand.type === 'up') {
      return ['#true', '#agree', '#like']
    }
    if (expand.type === 'down') {
      return ['#false', '#disagree', '#dislike']
    }
    return []
  })()

  let showUpvoteTooltip = false
  let showDownvoteTooltip = false
  const userId = user._id || user.id
  const index = findIndex(votedBy, (vote) => vote.userId === userId)
  if (index !== -1) {
    if (votedBy[index].type === 'up') {
      showUpvoteTooltip = true
    } else {
      showDownvoteTooltip = true
    }
  }

  const handleVote = useCallback(
    (tags: VoteOption) => {
      if (hasVoted) {
        return // Don't allow voting if user has already voted
      }
      onVote({ type: expand.type as VoteType, tags })
      setExpand({ open: false, type: '' })
    },
    [hasVoted, expand.type, onVote],
  )

  const handleAddComment = useCallback(() => {
    const withQuote = !isEmpty(selectedText.text)
    onAddComment(comment, withQuote)
    setComment('')
    setExpand({ open: false, type: '' })
  }, [comment, selectedText.text, onAddComment])

  const handleAddQuote = useCallback(() => {
    onAddQuote()
    setExpand({ open: false, type: '' })
  }, [onAddQuote])

  useEffect(() => {
    const selectionPopover = document.querySelector('#popButtons')
    if (selectionPopover) {
      const handleMouseDown = (e: Event) => {
        e.preventDefault()
      }
      selectionPopover.addEventListener('mousedown', handleMouseDown)
      return () => {
        if (selectionPopover) {
          selectionPopover.removeEventListener('mousedown', handleMouseDown)
        }
      }
    }
    return undefined
  }, [])

  const isComment = expand.type === 'comment'
  let inputValue = comment

  if (!isComment) {
    if (expand.type === 'up') {
      inputValue = '#true | #agree | #like'
    } else if (expand.type === 'down') {
      inputValue = '#false | #disagree | #dislike'
    }
  }

  const voteTooltipText = hasVoted
    ? `You have already ${userVoteType === 'up' ? 'upvoted' : 'downvoted'} this post`
    : ''

  return (
    <TooltipProvider>
      <div
        className="relative z-[1]"
        style={{
          backgroundImage: 'linear-gradient(to top, #1bb5d8, #4066ec)',
          width: checkWindowWidth ? 285 : 240,
          top: expand.open ? 181 : 170,
          left: 20,
        }}
      >
        <div className="grid grid-cols-4">
          {/* Upvote Button */}
          <div
            className={cn(
              'flex items-center justify-center',
              expand.type === 'up' && 'bg-[#2475b0]',
            )}
          >
            {hasVoted ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      className="opacity-50"
                    >
                      <Like size={30} />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{voteTooltipText}</p>
                </TooltipContent>
              </Tooltip>
            ) : showUpvoteTooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Like size={30} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Upvoted</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!hasVoted) {
                    setExpand({
                      open: expand.type !== 'up' || !expand.open,
                      type: 'up',
                    })
                  }
                }}
              >
                <Like size={30} />
              </Button>
            )}
          </div>

          {/* Downvote Button */}
          <div
            className={cn(
              'flex items-center justify-center',
              expand.type === 'down' && 'bg-[#2475b0]',
            )}
          >
            {hasVoted ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled
                      className="opacity-50"
                    >
                      <Dislike size={30} />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{voteTooltipText}</p>
                </TooltipContent>
              </Tooltip>
            ) : showDownvoteTooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Dislike size={30} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Downvoted</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (!hasVoted) {
                    setExpand({
                      open: expand.type !== 'down' || !expand.open,
                      type: 'down',
                    })
                  }
                }}
              >
                <Dislike size={30} />
              </Button>
            )}
          </div>

          {/* Comment Button */}
          <div
            className={cn(
              'flex items-center justify-center',
              expand.type === 'comment' && 'bg-[#2475b0]',
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setExpand({
                  open: expand.type !== 'comment' || !expand.open,
                  type: 'comment',
                })
              }
            >
              <Comment size={30} />
            </Button>
          </div>

          {/* Quote Button */}
          <div
            className={cn(
              'flex items-center justify-center',
              expand.type === 'quote' && 'bg-[#2475b0]',
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newQuote = expand.type !== 'quote'
                setExpand({ open: false, type: newQuote ? 'quote' : '' })
                if (newQuote) {
                  handleAddQuote()
                }
              }}
            >
              <Quote size={30} className="text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Options Panel */}
      <div
        id="popButtons"
        className={cn(
          'absolute bg-white p-4 shadow-lg transition-all duration-200',
          expand.open
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none',
          checkWindowWidth ? 'w-[310px]' : 'w-[270px]',
          'top-[205px]',
        )}
        style={{
          visibility: expand.open ? 'visible' : 'hidden',
        }}
      >
        {isComment ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type comment here"
              value={inputValue}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 text-[#3c4858cc] pb-1"
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  handleAddComment()
                }
              }}
            />
            <Button
              onClick={handleAddComment}
              className="bg-[#52b274] text-white hover:bg-[#52b274]/90"
              size="sm"
            >
              Send
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {voteOptions.map((option) => (
                <Button
                  key={option}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(option)}
                  className="normal-case"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

