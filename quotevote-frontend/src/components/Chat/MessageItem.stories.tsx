import React from 'react';

import MessageItem from './MessageItem';
import type { ChatMessage } from '@/types/chat';

const baseMessage: ChatMessage = {
    _id: 'message-1',
    messageRoomId: 'room-1',
    userId: '123123',
    userName: 'Jane Doe',
    title: 'Test message',
    text: 'Test',
    created: new Date().toISOString(),
    type: 'USER',
};

const message: ChatMessage & {
    user?: { avatar?: string | null; name?: string | null; username?: string | null };
    readBy?: string[];
} = {
    ...baseMessage,
    user: {
        avatar: 'J',
        name: 'Jane Doe',
        username: 'jane',
    },
    readBy: [],
};

export default {
    component: MessageItem,
    title: 'Chat/MessageItem',
};

export const Message = () => <MessageItem message={message} />;
