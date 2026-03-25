import MessageSend from './MessageSend';

const meta = {
    component: MessageSend,
    title: 'Chat/MessageSend',
};
export default meta;

const defaultProps = {
    messageRoomId: 'room-1',
    type: 'USER',
    title: 'Chat with Jane',
    componentId: null as string | null,
};

export const MessageSendInput = () => <MessageSend {...defaultProps} />;
