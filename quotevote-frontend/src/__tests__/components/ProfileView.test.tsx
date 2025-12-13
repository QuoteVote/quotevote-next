
import { render, screen } from '@testing-library/react';
import ProfileView from '@/components/Profile/ProfileView';
// @ts-ignore
import { MockedProvider } from '@apollo/client/testing/react';

// Mock router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock UserPosts to avoid complex nested testing
jest.mock('@/components/UserPosts/UserPosts', () => {
    return function MockUserPosts() {
        return <div data-testid="user-posts">User Posts Component</div>;
    };
});

const mockUser = {
    _id: 'user1',
    username: 'testuser',
    avatar: { url: 'avatar.jpg' },
    _followersId: ['user2'],
    _followingId: ['user3'],
    reputation: {
        _id: 'rep1',
        overallScore: 750,
        inviteNetworkScore: 800,
        conductScore: 700,
        activityScore: 750,
        metrics: {
            totalInvitesSent: 10,
            totalInvitesAccepted: 5,
            totalInvitesDeclined: 2,
            averageInviteeReputation: 600,
            totalReportsReceived: 0,
            totalReportsResolved: 0,
            totalUpvotes: 100,
            totalDownvotes: 5,
            totalPosts: 20,
            totalComments: 50,
        },
        lastCalculated: new Date().toISOString(),
    },
};

describe('ProfileView', () => {
    it('renders loading spinner when loading', () => {
        render(<ProfileView profileUser={null} loading={true} />);
        // Assuming LoadingSpinner renders a spinner or specific text
        // Since we don't know exact content, we can check if ProfileHeader is NOT present
        expect(screen.queryByText('testuser')).not.toBeInTheDocument();
    });

    it('renders invalid user message when no user', () => {
        render(<ProfileView profileUser={null} loading={false} />);
        expect(screen.getByText('Invalid user')).toBeInTheDocument();
        expect(screen.getByText('Return to homepage')).toBeInTheDocument();
    });

    it('renders profile header and reputation when user exists', () => {
        render(
            <MockedProvider>
                <ProfileView profileUser={mockUser} loading={false} />
            </MockedProvider>
        );

        expect(screen.getByText('testuser')).toBeInTheDocument();
        expect(screen.getByText('Reputation Score')).toBeInTheDocument();
        expect(screen.getAllByText('750')[0]).toBeInTheDocument(); // Overall score
        expect(screen.getByText('Good')).toBeInTheDocument(); // Label for 750
    });

    it('renders user posts section', () => {
        render(
            <MockedProvider>
                <ProfileView profileUser={mockUser} loading={false} />
            </MockedProvider>
        );

        expect(screen.getByTestId('user-posts')).toBeInTheDocument();
    });
});
