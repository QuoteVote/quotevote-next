// src/components/Voting/VotingPopup.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppStore } from '@/store';
import { LikeIcon, DislikeIcon, CommentIcon, QuoteIcon } from '../icons/VotingIcons';
import type { ParsedSelection } from '@/types/store';

interface Vote {
  userId: string;
  type: 'up' | 'down';
  deleted?: boolean;
}

export interface VotingPopupProps {
  votedBy: Vote[];
  onVote: (obj: { type: 'up' | 'down'; tags: string[] }) => Promise<void>;
  onAddComment: (comment: string, commentWithQuote?: boolean) => Promise<void>;
  onAddQuote: () => Promise<void>;
  selectedText: ParsedSelection;
  hasVoted: boolean;
  userVoteType: 'up' | 'down' | null;
  text: string;
}

type ExpandState = {
  open: boolean;
  type: '' | 'up' | 'down' | 'comment' | 'quote';
};

/**
 * VotingPopup - Popup for voting, commenting, and quoting
 * 
 * Features:
 * - Upvote/Downvote with tag selection
 * - Comment with or without quote
 * - Quick quote action
 * - Responsive design
 * - Disabled state when already voted
 */
export function VotingPopup({
  votedBy,
  onVote,
  onAddComment,
  onAddQuote,
  selectedText,
  hasVoted,
  userVoteType,
}: VotingPopupProps): JSX.Element {
  const user = useAppStore((state) => state.user?.data);
  const [expand, setExpand] = useState<ExpandState>({ open: false, type: '' });
  const [comment, setComment] = useState('');
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 400);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent mousedown from deselecting text
  useEffect(() => {
    const popButtons = document.querySelector('#popButtons');
    if (!popButtons) return;

    const preventDeselect = (e: Event) => {
      e.preventDefault();
    };

    popButtons.addEventListener('mousedown', preventDeselect);
    return () => {
      popButtons.removeEventListener('mousedown', preventDeselect);
    };
  }, [expand.open]);

  // Get vote options based on type
  const getVoteOptions = (): string[] => {
    if (expand.type === 'up') {
      return ['#true', '#agree', '#like'];
    }
    if (expand.type === 'down') {
      return ['#false', '#disagree', '#dislike'];
    }
    return [];
  };

  // Check if user has voted before
  const userPreviousVote = votedBy.find((vote) => vote.userId === user?._id);
  const showUpvoteTooltip = userPreviousVote?.type === 'up';
  const showDownvoteTooltip = userPreviousVote?.type === 'down';

  // Handle vote submission
  const handleVote = async (tag: string): Promise<void> => {
    if (hasVoted) return;

    await onVote({ type: expand.type as 'up' | 'down', tags: [tag] });
    setExpand({ open: false, type: '' });
  };

  // Handle comment submission
  const handleAddComment = async (): Promise<void> => {
    if (!comment.trim()) return;

    const withQuote = selectedText.text.length > 0;
    await onAddComment(comment, withQuote);
    setComment('');
    setExpand({ open: false, type: '' });
  };

  // Handle quote action
  const handleAddQuote = async (): Promise<void> => {
    await onAddQuote();
    setExpand({ open: false, type: '' });
  };

  // Handle key press in comment input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleAddComment();
    }
  };

  // Get input value based on expand type
  const getInputValue = (): string => {
    if (expand.type === 'comment') {
      return comment;
    }
    if (expand.type === 'up') {
      return '#true | #agree | #like';
    }
    if (expand.type === 'down') {
      return '#false | #disagree | #dislike';
    }
    return '';
  };

  const isComment = expand.type === 'comment';
  const voteOptions = getVoteOptions();

  return (
    <div className="relative">
      {/* Main Action Bar */}
      <div
        className={`bg-gradient-to-t from-[#1bb5d8] to-[#4066ec] rounded-lg shadow-lg ${
          isSmallScreen ? 'w-[240px]' : 'w-[285px]'
        } ${expand.open ? 'mb-2' : ''}`}
      >
        <div className="grid grid-cols-4">
          {/* Upvote Button */}
          <div
            className={`flex items-center justify-center ${
              expand.type === 'up' ? 'bg-[#2475b0]' : ''
            }`}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled={hasVoted}
                    onClick={() => {
                      if (!hasVoted) {
                        setExpand({
                          open: expand.type !== 'up' || !expand.open,
                          type: 'up',
                        });
                      }
                    }}
                    className={`p-3 text-white transition-opacity ${
                      hasVoted ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                    }`}
                  >
                    <LikeIcon className="w-8 h-8" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasVoted
                    ? `You have already ${userVoteType}voted this post`
                    : showUpvoteTooltip
                    ? 'Upvoted'
                    : 'Upvote'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Downvote Button */}
          <div
            className={`flex items-center justify-center ${
              expand.type === 'down' ? 'bg-[#2475b0]' : ''
            }`}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    disabled={hasVoted}
                    onClick={() => {
                      if (!hasVoted) {
                        setExpand({
                          open: expand.type !== 'down' || !expand.open,
                          type: 'down',
                        });
                      }
                    }}
                    className={`p-3 text-white transition-opacity ${
                      hasVoted ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                    }`}
                  >
                    <DislikeIcon className="w-8 h-8" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasVoted
                    ? `You have already ${userVoteType}voted this post`
                    : showDownvoteTooltip
                    ? 'Downvoted'
                    : 'Downvote'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Comment Button */}
          <div
            className={`flex items-center justify-center ${
              expand.type === 'comment' ? 'bg-[#2475b0]' : ''
            }`}
          >
            <button
              onClick={() =>
                setExpand({
                  open: expand.type !== 'comment' || !expand.open,
                  type: 'comment',
                })
              }
              className="p-3 text-white hover:opacity-80 transition-opacity"
            >
              <CommentIcon className="w-8 h-8" />
            </button>
          </div>

          {/* Quote Button */}
          <div
            className={`flex items-center justify-center ${
              expand.type === 'quote' ? 'bg-[#2475b0]' : ''
            }`}
          >
            <button
              onClick={() => {
                const newQuote = expand.type !== 'quote';
                setExpand({ open: false, type: newQuote ? 'quote' : '' });
                if (newQuote) {
                  handleAddQuote();
                }
              }}
              className="p-3 text-white hover:opacity-80 transition-opacity"
            >
              <QuoteIcon className="w-7 h-7" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expand.open && (
        <div
          id="popButtons"
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 ${
            isSmallScreen ? 'w-[270px]' : 'w-[310px]'
          } animate-in zoom-in-95 duration-200`}
        >
          {isComment ? (
            <div className="flex gap-2">
              <Input
                placeholder="Type comment here"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                className="bg-[#52b274] hover:bg-[#469a64]"
                size="sm"
              >
                Send
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2 flex-wrap justify-center">
                {voteOptions.map((option) => (
                  <Button
                    key={option}
                    onClick={() => handleVote(option)}
                    variant="outline"
                    size="sm"
                    className="text-sm"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
