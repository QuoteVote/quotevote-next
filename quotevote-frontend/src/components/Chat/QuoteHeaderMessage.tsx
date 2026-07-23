"use client";

import type { FC } from 'react';
import { Quote } from 'lucide-react';

import Avatar from '@/components/Avatar';
import { Card, CardContent } from '@/components/ui/card';
import type { ChatParticipant } from '@/types/chat';

interface QuotePostDetails {
  _id?: string;
  title?: string | null;
  text?: string | null;
  userId?: string | null;
  url?: string | null;
}

interface QuoteHeaderMessageProps {
  postDetails: QuotePostDetails | null | undefined;
  postCreator: ChatParticipant | null | undefined;
}

const QuoteHeaderMessage: FC<QuoteHeaderMessageProps> = ({
  postDetails,
  postCreator,
}) => {
  if (!postDetails) return null;

  const { title, text } = postDetails;

  const authorName =
    postCreator?.name || postCreator?.username || 'Unknown User';

  return (
    <div className="px-4 pb-2 pt-3">
      <Card className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-slate-50 to-white shadow-sm dark:from-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600" />
        <CardContent className="relative flex flex-col gap-3 pl-4">
          <div className="flex items-center gap-3">
            {postCreator && (
              <Avatar
                src={postCreator.avatar}
                alt={authorName}
                size={40}
                className="h-10 w-10 border-2 border-background shadow-sm"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground">
                {authorName}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Quote className="h-3.5 w-3.5 text-emerald-500" />
                <span>Original Quote</span>
              </div>
            </div>
          </div>

          {title && (
            <div className="text-sm font-semibold leading-snug text-foreground">
              {title}
            </div>
          )}

          {text && (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {text}
            </div>
          )}

          <div className="mt-1 inline-flex items-center gap-1 self-start rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-white shadow-sm">
            <Quote className="mr-1 h-3 w-3" />
            <span>Discussion Topic</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuoteHeaderMessage;

