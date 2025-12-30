// @ts-expect-error - Storybook types may be missing
import type { Meta, StoryObj } from '@storybook/react';
// @ts-expect-error - Storybook types/Apollo types
import { MockedProvider } from '@apollo/client/testing';
import BuddyList from './BuddyList';
import { GET_CHAT_ROOMS } from '@/graphql/queries';

const mocks = [
    {
        request: {
            query: GET_CHAT_ROOMS,
        },
        result: {
            data: {
                messageRooms: [
                    {
                        _id: '1',
                        title: 'General Chat',
                        messageType: 'POST',
                        avatar: null,
                        unreadMessages: 2,
                        created: new Date().toISOString(),
                    },
                    {
                        _id: '2',
                        title: 'John Doe',
                        messageType: 'USER',
                        avatar: null,
                        unreadMessages: 0,
                        created: new Date(Date.now() - 10000).toISOString(),
                    },
                ],
            },
        },
    },
];

const meta: Meta<typeof BuddyList> = {
    title: 'Chat/BuddyList',
    component: BuddyList,
    parameters: {
        layout: 'centered',
    },
    decorators: [
        // @ts-expect-error - Decorator type mismatch
        (Story) => (
            <MockedProvider mocks={mocks} addTypename={false}>
                <div className="w-[400px] h-[600px] border rounded-lg shadow-lg overflow-hidden bg-white">
                    <Story />
                </div>
            </MockedProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof BuddyList>;

export const Default: Story = {};

export const Empty: Story = {
    decorators: [
        // @ts-expect-error - Decorator type mismatch
        (Story) => (
            <MockedProvider mocks={[]} addTypename={false}>
                <div className="w-[400px] h-[600px] border rounded-lg shadow-lg overflow-hidden bg-white">
                    <Story />
                </div>
            </MockedProvider>
        ),
    ],
};
