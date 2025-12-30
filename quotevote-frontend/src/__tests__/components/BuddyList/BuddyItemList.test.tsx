import { TextEncoder } from 'util';
global.TextEncoder = TextEncoder;

import { render, screen } from '@testing-library/react';
import BuddyItemList from '@/components/BuddyList/BuddyItemList';
import { BuddyItem } from '@/types/buddylist';

// Mock Apollo hooks directly
jest.mock('@apollo/client/react', () => ({
    useLazyQuery: jest.fn(() => [jest.fn(), { loading: false, data: undefined }]),
    useQuery: jest.fn(() => ({ loading: false, error: undefined, data: undefined })),
}));

// Mock store
jest.mock('@/store', () => ({
    useAppStore: (selector: (state: unknown) => unknown) => selector({
        user: { data: { _id: 'me' } },
        setSelectedChatRoom: jest.fn(),
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
    it('renders items', () => {
        render(<BuddyItemList buddyList={mockItems} />);
        expect(screen.getByText('Buddy 1')).toBeInTheDocument();
    });

    it('renders empty state', () => {
        render(<BuddyItemList buddyList={[]} />);
        expect(screen.getByText('No Conversations Yet')).toBeInTheDocument();
    });
});
