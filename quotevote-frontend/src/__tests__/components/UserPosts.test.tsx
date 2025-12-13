
import { render, screen, waitFor } from '@testing-library/react';
// @ts-ignore
import { MockedProvider } from '@apollo/client/testing/react';
import UserPosts from '@/components/UserPosts/UserPosts';
import { GET_TOP_POSTS } from '@/graphql/queries';

// Mock router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

const mockPosts = [
    {
        __typename: 'Post',
        _id: '1',
        title: 'Test Post 1',
        text: 'This is a test post content',
        created: new Date().toISOString(),
        upvotes: [],
        downvotes: [],
        comments: [],
        approvedBy: [],
        rejectedBy: [],
        creator: {
            __typename: 'User',
            _id: 'user1',
            username: 'testuser',
            avatar: { url: 'avatar.jpg' },
        },
        votes: [],
        quotes: [],
        messageRoom: { __typename: 'MessageRoom', messages: [] },
    },
    {
        __typename: 'Post',
        _id: '2',
        title: 'Test Post 2',
        text: 'Another test post',
        created: new Date().toISOString(),
        upvotes: [],
        downvotes: [],
        comments: [],
        approvedBy: [],
        rejectedBy: [],
        creator: {
            __typename: 'User',
            _id: 'user1',
            username: 'testuser',
            avatar: { url: 'avatar.jpg' },
        },
        votes: [],
        quotes: [],
        messageRoom: { __typename: 'MessageRoom', messages: [] },
    },
];

const mocks = [
    {
        request: {
            query: GET_TOP_POSTS,
            variables: {
                limit: 15,
                offset: 0,
                searchKey: '',
                userId: 'user1',
                friendsOnly: false,
                interactions: false,
                sortOrder: undefined,
                groupId: undefined,
                approved: undefined,
                startDateRange: undefined,
                endDateRange: undefined,
            },
        },
        result: {
            data: {
                posts: {
                    __typename: 'PaginatedPosts',
                    entities: mockPosts,
                    pagination: {
                        total_count: 2,
                        limit: 15,
                        offset: 0,
                    },
                },
            },
        },
    },
];

const emptyMocks = [
    {
        request: {
            query: GET_TOP_POSTS,
            variables: {
                limit: 15,
                offset: 0,
                searchKey: '',
                userId: 'user1',
                friendsOnly: false,
                interactions: false,
                sortOrder: undefined,
                groupId: undefined,
                approved: undefined,
                startDateRange: undefined,
                endDateRange: undefined,
            },
        },
        result: {
            data: {
                posts: {
                    __typename: 'PaginatedPosts',
                    entities: [],
                    pagination: {
                        total_count: 0,
                        limit: 15,
                        offset: 0,
                    },
                },
            },
        },
    },
    {
        request: {
            query: GET_TOP_POSTS,
            variables: {
                limit: 15,
                offset: 0,
                searchKey: '',
                userId: 'user1',
                friendsOnly: false,
                interactions: false,
                sortOrder: undefined,
                groupId: undefined,
                approved: undefined,
                startDateRange: undefined,
                endDateRange: undefined,
            },
        },
        result: {
            data: {
                posts: {
                    __typename: 'PaginatedPosts',
                    entities: [],
                    pagination: {
                        total_count: 0,
                        limit: 15,
                        offset: 0,
                    },
                },
            },
        },
    },
];

describe('UserPosts', () => {
    it('renders loading state initially', () => {
        render(
            <MockedProvider mocks={mocks}>
                <UserPosts userId="user1" />
            </MockedProvider>
        );
        // Check for skeleton or loading indicator
        // Since we use PostSkeleton which has animate-pulse, we can check for that class or structure
        // Or just check that posts are not yet visible
        expect(screen.queryByText('Test Post 1')).not.toBeInTheDocument();
    });

    it('renders posts after loading', async () => {
        render(
            <MockedProvider mocks={mocks}>
                <UserPosts userId="user1" />
            </MockedProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Post 1')).toBeInTheDocument();
            expect(screen.getByText('Test Post 2')).toBeInTheDocument();
        });
    });

    it('renders empty state when no posts', async () => {
        render(
            <MockedProvider mocks={emptyMocks}>
                <UserPosts userId="user1" />
            </MockedProvider>
        );

        await waitFor(() => {
            // console.log(document.body.innerHTML);
            const skeletons = document.querySelectorAll('.animate-pulse');
            console.log('Skeletons found:', skeletons.length);
            if (skeletons.length > 0) {
                console.log('Still loading...');
            }
            expect(screen.getByText('No items found')).toBeInTheDocument();
        });
    });

    it('handles error state', async () => {
        const errorMock = [
            {
                request: {
                    query: GET_TOP_POSTS,
                    variables: {
                        limit: 15,
                        offset: 0,
                        searchKey: '',
                        userId: 'user1',
                        friendsOnly: false,
                        interactions: false,
                        sortOrder: undefined,
                        groupId: undefined,
                        approved: undefined,
                        startDateRange: undefined,
                        endDateRange: undefined,
                    },
                },
                error: new Error('Network error'),
            },
        ];

        render(
            <MockedProvider mocks={errorMock}>
                <UserPosts userId="user1" />
            </MockedProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        });
    });
});
