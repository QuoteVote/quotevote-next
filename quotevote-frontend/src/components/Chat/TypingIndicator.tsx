"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useSubscription } from '@apollo/client/react';

import { TYPING_SUBSCRIPTION } from '@/graphql/subscriptions';
import { useAppStore } from '@/store';

interface TypingIndicatorProps {
  messageRoomId?: string | null;
}

interface TypingUser {
  userId: string;
  user?: {
    name?: string | null;
    username?: string | null;
  } | null;
  timestamp: string;
}

import type { TypingSubscriptionResult } from '@/types/hooks'

interface TypingSubscriptionVariables {
  messageRoomId: string;
}

const TypingIndicator: FC<TypingIndicatorProps> = ({ messageRoomId }) => {
  const currentUser = useAppStore((state) => state.user.data) as
    | { _id?: string }
    | undefined;
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const { data: subscriptionData, error } = useSubscription<
    TypingSubscriptionResult,
    TypingSubscriptionVariables
  >(TYPING_SUBSCRIPTION, {
    skip: !messageRoomId,
    variables: messageRoomId ? { messageRoomId } : { messageRoomId: '' },
  });

  // Handle subscription data updates (Apollo Client v4 API)
  // Note: This effect handles external subscription data, which is a valid use case for setState in effects
  useEffect(() => {
    const typingEvent = subscriptionData?.typing;
    if (!typingEvent) return;

    const { userId, isTyping, timestamp, user } = typingEvent;

    // Don't show typing indicator for current user
    if (userId && currentUser?._id && userId === currentUser._id) {
      return;
    }

    // Use functional update to avoid dependency on typingUsers
    setTypingUsers((prev) => {
      if (isTyping) {
        // Update existing user or add new one
        const existingUser = prev.find((u) => u.userId === userId);
        if (existingUser) {
          return prev.map((u) =>
            u.userId === userId ? { ...u, timestamp, user } : u
          );
        }
        return [...prev, { userId, user, timestamp }];
      }

      // Remove user from list when they stop typing
      return prev.filter((u) => u.userId !== userId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subscriptionData is the only dependency we need
  }, [subscriptionData]);

  // Handle subscription errors
  useEffect(() => {
    if (error && process.env.NODE_ENV === 'development') {
      console.error('[Typing Subscription] Subscription error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) =>
        prev.filter((user) => {
          const ts = new Date(user.timestamp).getTime();
          return now - ts < 10000;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [typingUsers.length]);

  if (!messageRoomId || typingUsers.length === 0) {
    return <div className="min-h-6 px-4 pb-1" />;
  }

  const getTypingMessage = (): string => {
    if (typingUsers.length === 1) {
      const user = typingUsers[0].user;
      const name = user?.name || user?.username || 'Someone';
      return `${name} is typing…`;
    }
    if (typingUsers.length === 2) return '2 people are typing…';
    return `${typingUsers.length} people are typing…`;
  };

  return (
    <div className="flex min-h-6 items-center px-4 pb-1 text-xs text-muted-foreground">
      <span className="italic">{getTypingMessage()}</span>
      <span className="ml-2 inline-flex items-center gap-1" aria-hidden="true">
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
          style={{ animationDelay: '0.2s' }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
          style={{ animationDelay: '0.4s' }}
        />
      </span>
    </div>
  );
};

export default TypingIndicator;
