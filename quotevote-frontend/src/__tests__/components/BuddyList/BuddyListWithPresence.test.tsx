import { TextEncoder } from 'util';
global.TextEncoder = TextEncoder;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentNode } from 'graphql';
import BuddyListWithPresence from '@/components/BuddyList/BuddyListWithPresence';
import { GET_BUDDY_LIST, GET_ROSTER } from '@/graphql/queries';

// --- Mocks ---

// 1. Mock Apollo
const mockUseQuery = jest.fn();
jest.mock('@apollo/client/react', () => ({
    useQuery: (query: DocumentNode, options: unknown) => mockUseQuery(query, options),
}));

// 2. Mock Store & Hooks
const mockSetSnackbar = jest.fn();
const mockSetBuddyList = jest.fn();
const mockPresenceMap = {
    'u2': { status: 'online', statusMessage: 'Working' },
};

jest.mock('@/store', () => ({
    useAppStore: (selector: (state: unknown) => unknown) => selector({
        user: {
            data: { _id: 'me', username: 'me' }
        },
        chat: {
            presenceMap: mockPresenceMap
        },
        setBuddyList: mockSetBuddyList,
        setSnackbar: mockSetSnackbar,
    }),
}));

// Mock custom hooks
const mockAcceptBuddy = jest.fn();
const mockDeclineBuddy = jest.fn();
jest.mock('@/hooks/useRosterManagement', () => ({
    useRosterManagement: () => ({
        acceptBuddy: mockAcceptBuddy,
        declineBuddy: mockDeclineBuddy,
    }),
}));

jest.mock('@/hooks/usePresenceSubscription', () => ({
    usePresenceSubscription: jest.fn(),
}));


// 3. Mock Components
jest.mock('@/components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('@/components/Avatar', () => ({
    __esModule: true,
    default: () => <div data-testid="avatar">Avatar</div>,
}));

jest.mock('lucide-react', () => ({
    Check: () => <span>Check</span>,
    X: () => <span>X</span>,
    MessageSquare: () => <span>Msg</span>,
    Users: () => <span>Users</span>,
}));

jest.mock('@/lib/utils', () => ({
    cn: (...inputs: (string | undefined | null | false)[]) => inputs.join(' '),
}));

// Mock BuddyItemList to inspect props
jest.mock('@/components/BuddyList/BuddyItemList', () => ({
    __esModule: true,
    default: ({ buddyList }: { buddyList: { user: { _id: string, name: string }, presence: { status: string } }[] }) => (
        <div data-testid="buddy-item-list">
            {buddyList.map((b) => (
                <div key={b.user._id} data-testid={`buddy-item-${b.presence.status}`}>
                    {b.user.name} - {b.presence.status}
                </div>
            ))}
        </div>
    ),
}));

jest.mock('@/graphql/queries', () => ({
    GET_BUDDY_LIST: 'GET_BUDDY_LIST',
    GET_ROSTER: 'GET_ROSTER',
}));

// --- Tests ---

describe('BuddyListWithPresence Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseQuery.mockReset();
    });

    const setupData = () => {
        // Mock return values for queries
        mockUseQuery.mockImplementation((query) => {
            if (query === GET_BUDDY_LIST) {
                return {
                    loading: false,
                    data: {
                        buddyList: [
                            {
                                id: 'r1',
                                buddyId: 'u2', // matches presenceMap key
                                status: 'accepted',
                                buddy: { _id: 'u2', name: 'Friend 1', username: 'friend1', avatar: null },
                                presence: { status: 'offline' } // Should be overridden by presenceMap
                            },
                            {
                                id: 'r2',
                                buddyId: 'u3',
                                status: 'accepted',
                                buddy: { _id: 'u3', name: 'Friend 2', username: 'friend2', avatar: null },
                                presence: { status: 'offline' }
                            }
                        ]
                    }
                };
            }
            if (query === GET_ROSTER) {
                return {
                    loading: false,
                    refetch: jest.fn(),
                    data: {
                        roster: {
                            pendingRequests: [
                                {
                                    id: 'req1',
                                    buddy: { _id: 'u4', name: 'Requester', username: 'req', avatar: null }
                                }
                            ],
                            buddies: [],
                            blockedUsers: []
                        }
                    }
                };
            }
            return { loading: false, data: null };
        });
    };

    it('renders and groups buddies correctly', () => {
        setupData();
        render(<BuddyListWithPresence />);

        // Friend 1 is 'u2', presenceMap says 'online'
        expect(screen.getByText('Friend 1 - online')).toBeInTheDocument();

        // Friend 2 is 'u3', no presenceMap, falls back to 'offline' (default or from item)
        // Note: The mock component prints status.
        expect(screen.getByText('Friend 2 - offline')).toBeInTheDocument();
    });

    it('displays pending requests', () => {
        setupData();
        render(<BuddyListWithPresence />);

        expect(screen.getByText('Pending Requests')).toBeInTheDocument();
        expect(screen.getByText('Requester')).toBeInTheDocument();
        expect(screen.getByText('Wants to be your buddy')).toBeInTheDocument();
    });

    it('handles accepting a buddy request', async () => {
        setupData();
        render(<BuddyListWithPresence />);

        const acceptBtn = screen.getByTitle('Accept');
        fireEvent.click(acceptBtn);

        await waitFor(() => {
            expect(mockAcceptBuddy).toHaveBeenCalledWith('req1');
            expect(mockSetSnackbar).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Buddy request accepted!',
                type: 'success',
            }));
        });
    });

    it('handles declining a buddy request', async () => {
        setupData();
        render(<BuddyListWithPresence />);

        const declineBtn = screen.getByTitle('Decline');
        fireEvent.click(declineBtn);

        await waitFor(() => {
            expect(mockDeclineBuddy).toHaveBeenCalledWith('req1');
            expect(mockSetSnackbar).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Buddy request declined',
                type: 'info',
            }));
        });
    });
});
