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

interface TypingSubscriptionData {
  typing?: {
    userId: string;
    isTyping: boolean;
    timestamp: string;
    user?: {
      name?: string | null;
      username?: string | null;
    } | null;
  } | null;
}

interface TypingSubscriptionVariables {
  messageRoomId: string;
}

const TypingIndicator: FC<TypingIndicatorProps> = ({ messageRoomId }) => {
  const currentUser = useAppStore((state) => state.user.data) as
    | { _id?: string }
    | undefined;
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const { error } = useSubscription<
    TypingSubscriptionData,
    TypingSubscriptionVariables
  >(TYPING_SUBSCRIPTION, {
    skip: !messageRoomId,
    variables: messageRoomId ? { messageRoomId } : { messageRoomId: '' },
    onData: ({ data }) => {
      const typingEvent = data.data?.typing;
      if (!typingEvent) return;

      const { userId, isTyping, timestamp, user } = typingEvent;

      if (userId && currentUser?._id && userId === currentUser._id) {
        return;
      }

      setTypingUsers((prev) => {
        if (isTyping) {
          if (prev.find((u) => u.userId === userId)) {
            return prev.map((u) =>
              u.userId === userId ? { ...u, timestamp, user } : u
            );
          }
          return [...prev, { userId, user, timestamp }];
        }

        return prev.filter((u) => u.userId !== userId);
      });
    },
    onError: (err) => {
      console.error('[Typing Subscription] Error:', err);
    },
  });

  useEffect(() => {
    if (error) {
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
