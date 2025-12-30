import { TextEncoder } from 'util';
global.TextEncoder = TextEncoder;

import { render, screen } from '@testing-library/react';
import { DocumentNode } from 'graphql';
import BuddyList from '@/components/BuddyList/BuddyList';

// --- Mocks ---

// 1. Mock Apollo useQuery
const mockUseQuery = jest.fn();
jest.mock('@apollo/client/react', () => ({
    useQuery: (query: DocumentNode, options: unknown) => mockUseQuery(query, options),
}));

// 2. Mock Child Component (BuddyItemList)
// We mock this to verify it gets passed the right data, without testing its internals again.
jest.mock('@/components/BuddyList/BuddyItemList', () => ({
    __esModule: true,
    default: ({ buddyList }: { buddyList: { room: { _id: string }, Text: string }[] }) => (
        <div data-testid="buddy-item-list">
            {buddyList.map((b) => (
                <div key={b.room._id} data-testid="buddy-item">
                    {b.Text}
                </div>
            ))}
        </div>
    ),
}));

// 3. Mock LoadingSpinner
jest.mock('@/components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('@/graphql/queries', () => ({
    GET_CHAT_ROOMS: { kind: 'Document' },
}));

// --- Tests ---

describe('BuddyList Component', () => {
    beforeEach(() => {
        mockUseQuery.mockReset();
    });

    it('renders loading state initially', () => {
        mockUseQuery.mockReturnValue({
            loading: true,
            data: undefined
        });

        render(<BuddyList />);
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders buddy list when data is loaded', () => {
        mockUseQuery.mockReturnValue({
            loading: false,
            data: {
                messageRooms: [
                    {
                        _id: 'room-1',
                        title: 'General',
                        messageType: 'POST',
                        created: new Date().toISOString(),
                    },
                    {
                        _id: 'room-2',
                        title: 'Random',
                        messageType: 'POST',
                        created: new Date(Date.now() - 10000).toISOString(),
                    }
                ]
            }
        });

        render(<BuddyList />);

        // Check if our mock BuddyItemList rendered the items
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Random')).toBeInTheDocument();
        expect(screen.getAllByTestId('buddy-item')).toHaveLength(2);
    });

    it('filters buddies based on search prop', () => {
        mockUseQuery.mockReturnValue({
            loading: false,
            data: {
                messageRooms: [
                    {
                        _id: 'room-1',
                        title: 'Apple',
                        messageType: 'POST',
                        created: new Date().toISOString(),
                    },
                    {
                        _id: 'room-2',
                        title: 'Banana',
                        messageType: 'POST',
                        created: new Date().toISOString(),
                    }
                ]
            }
        });

        render(<BuddyList search="App" />);

        // Should show Apple, not Banana
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
        mockUseQuery.mockReturnValue({
            loading: false,
            data: { messageRooms: [] }
        });

        render(<BuddyList />);

        // Should invoke BuddyItemList with empty array
        const list = screen.getByTestId('buddy-item-list');
        expect(list).toBeInTheDocument();
        expect(list.children).toHaveLength(0);
    });
});
