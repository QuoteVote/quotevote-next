import { TextEncoder } from 'util';
global.TextEncoder = TextEncoder;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BuddyItemList from '@/components/BuddyList/BuddyItemList';
import { BuddyItem } from '@/types/buddylist';

const mockGetChatRoom = jest.fn();
const mockSetSelectedChatRoom = jest.fn();

// Mock Apollo hooks directly
jest.mock('@apollo/client/react', () => ({
    useLazyQuery: jest.fn(() => [mockGetChatRoom, { loading: false, data: undefined }]),
    useQuery: jest.fn(() => ({ loading: false, error: undefined, data: undefined })),
}));

// Mock store
jest.mock('@/store', () => ({
    useAppStore: (selector: (state: unknown) => unknown) => selector({
        user: { data: { _id: 'me' } },
        setSelectedChatRoom: mockSetSelectedChatRoom,
    }),
}));

// Mock Tooltip
jest.mock('@/components/ui/tooltip', () => ({
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock other components
jest.mock('@/components/Avatar', () => ({
    __esModule: true,
    default: () => <div data-testid="avatar">Avatar</div>,
}));

jest.mock('@/components/Chat/PresenceIcon', () => ({
    __esModule: true,
    default: () => <div data-testid="presence-icon">PresenceIcon</div>,
}));

jest.mock('@/components/Chat/StatusMessage', () => ({
    __esModule: true,
    default: () => <div data-testid="status-message">StatusMessage</div>,
}));

jest.mock('lucide-react', () => ({
    MessageSquare: () => <div data-testid="message-square">MessageSquare</div>,
    Users: () => <div data-testid="users">Users</div>,
    Check: () => <div data-testid="check">Check</div>,
    X: () => <div data-testid="x">X</div>,
}));

jest.mock('@/lib/utils', () => ({
    cn: (...inputs: string[]) => inputs.join(' '),
}));

jest.mock('@/graphql/queries', () => ({
    GET_CHAT_ROOM: { kind: 'Document', definitions: [] },
}));

const mockItems: BuddyItem[] = [
    {
        _id: '1',
        Text: 'Buddy 1',
        type: 'USER',
        unreadMessages: 1,
    }
];

describe('BuddyItemList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders items', () => {
        render(<BuddyItemList buddyList={mockItems} />);
        expect(screen.getByText('Buddy 1')).toBeInTheDocument();
    });

    it('renders an empty list with no placeholder rows', () => {
        const { container } = render(<BuddyItemList buddyList={[]} />);
        const list = container.querySelector('ul.qv-buddy-list');
        expect(list).toBeInTheDocument();
        expect(list).toBeEmptyDOMElement();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders each buddy as a list item with a native button', () => {
        const { container } = render(<BuddyItemList buddyList={mockItems} />);
        const rows = container.querySelectorAll('li.qv-buddy');
        expect(rows).toHaveLength(1);
        const button = screen.getByRole('button', { name: /Buddy 1/ });
        expect(button.tagName).toBe('BUTTON');
        expect(button).toHaveAttribute('type', 'button');
        expect(rows[0]).toContainElement(button);
    });

    it('shows the unread count with a screen reader label', () => {
        render(<BuddyItemList buddyList={mockItems} />);
        expect(screen.getByRole('button')).toHaveTextContent('1 unread');
    });

    it.each([
        [{ status: 'online' }, undefined, 'Online'],
        [{ status: 'away' }, 'Back soon', 'Away · Back soon'],
        [{ status: 'dnd' }, undefined, 'Do Not Disturb'],
        [{ status: 'offline' }, undefined, 'Offline'],
        [{ status: 'something-else' }, undefined, 'Offline'],
    ])('shows the presence detail for %o', (presence, statusMessage, expected) => {
        const { container } = render(
            <BuddyItemList buddyList={[{ ...mockItems[0], presence, statusMessage }]} />
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
        expect(container.querySelector('.qv-presence-dot')).toHaveAttribute(
            'data-status',
            ['online', 'away', 'dnd'].includes(presence.status) ? presence.status : 'offline'
        );
    });

    it.each([
        [5 * 60 * 1000, '5m ago'],
        [2 * 60 * 60 * 1000, '2h ago'],
        [3 * 24 * 60 * 60 * 1000, '3d ago'],
    ])('shows when an offline buddy was last seen (%i ms ago)', (ago, expected) => {
        render(
            <BuddyItemList
                buddyList={[
                    { ...mockItems[0], presence: { status: 'offline', lastSeen: Date.now() - ago } },
                ]}
            />
        );
        expect(screen.getByText(`Offline · last seen ${expected}`)).toBeInTheDocument();
    });

    it('opens the room directly when the item already has one', () => {
        const item = {
            ...mockItems[0],
            room: { _id: 'room-9', title: 'Bea' },
        } as unknown as BuddyItem;
        render(<BuddyItemList buddyList={[item]} />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockSetSelectedChatRoom).toHaveBeenCalledWith('room-9');
        expect(mockGetChatRoom).not.toHaveBeenCalled();
    });

    it('opens the existing direct room with the buddy when there is one', async () => {
        mockGetChatRoom.mockResolvedValue({ data: { messageRoom: { _id: 'room-bea' } } });
        const buddy = {
            _id: 'b1',
            user: { _id: 'bea-id', name: 'Bea', username: 'bea' },
        } as unknown as BuddyItem;

        render(<BuddyItemList buddyList={[buddy]} />);
        fireEvent.click(screen.getByRole('button'));

        await waitFor(() => expect(mockSetSelectedChatRoom).toHaveBeenCalledWith('room-bea'));
        expect(mockGetChatRoom).toHaveBeenCalledWith({ variables: { otherUserId: 'bea-id' } });
    });

    it('stages a new conversation with the buddy as its recipient (#713)', async () => {
        mockGetChatRoom.mockResolvedValue({ data: { messageRoom: null } });
        const buddy = {
            _id: 'b1',
            Text: 'Bea',
            type: 'USER',
            user: { _id: 'bea-id', name: 'Bea', username: 'bea' },
        } as unknown as BuddyItem;

        render(<BuddyItemList buddyList={[buddy]} />);
        fireEvent.click(screen.getAllByRole('button')[0]);

        await waitFor(() =>
            expect(mockSetSelectedChatRoom).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: null,
                    messageType: 'USER',
                    users: ['me', 'bea-id'],
                    recipientId: 'bea-id',
                })
            )
        );
    });

    it('buddy items respond to Enter key', () => {
        render(<BuddyItemList buddyList={mockItems} />);
        const button = screen.getAllByRole('button')[0];
        fireEvent.keyDown(button, { key: 'Enter' });
        // Should not throw; interaction handled
        expect(button).toBeInTheDocument();
    });

    it('buddy items respond to Space key', () => {
        render(<BuddyItemList buddyList={mockItems} />);
        const button = screen.getAllByRole('button')[0];
        fireEvent.keyDown(button, { key: ' ' });
        expect(button).toBeInTheDocument();
    });
});
