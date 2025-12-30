import MessageSend from './MessageSend';

export default {
    component: MessageSend,
    title: 'Chat/MessageSend',
};

const defaultProps = {
    messageRoomId: 'room-1',
    type: 'USER',
    title: 'Chat with Jane',
    componentId: null as string | null,
};

export const MessageSendInput = () => <MessageSend {...defaultProps} />;
