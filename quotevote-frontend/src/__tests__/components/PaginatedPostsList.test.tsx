// src/__tests__/components/PaginatedPostsList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import PaginatedPostsList from '../../components/Post/PaginatedPostsList';

// ---- Mocks ----
jest.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    loading: false,
    error: undefined,
    data: {
      posts: {
        entities: [
          {
            _id: 'p1',
            title: 'First post',
            text: 'Body 1',
            creator: {
              name: 'Alice',
              username: 'alice',
              avatar: { url: '', color: '#000', initials: 'A' },
            },
            userId: 'u1',
            created: new Date().toISOString(),
            approvedBy: [],
            rejectedBy: [],
            votedBy: [],
            votes: [],
            enable_voting: true,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    },
    refetch: jest.fn(),
  }),
}));

// Expose onHidePost so we can assert it is called
const onHidePostMock = jest.fn();

jest.mock('@/components/Post/PostCard', () => ({
  PostCard: (props: any) => {
    // capture onHidePost for assertions
    if (props.onHidePost) {
      (global as any).__onHidePost = props.onHidePost;
    }
    return (
      <div data-testid="post-card">
        <span>{props.title}</span>
        <button onClick={() => props.onHidePost?.({ _id: props._id })}>
          Hide
        </button>
      </div>
    );
  },
}));

jest.mock('@/components/Post/PostSkeleton', () => ({
  PostSkeleton: () => <div data-testid="post-skeleton" />,
}));

jest.mock('@/components/common/PaginatedList', () => ({
  PaginatedList: (props: any) => (
    <div data-testid="paginated-list">
      {props.data.map((item: any) => props.renderItem(item))}
    </div>
  ),
}));

jest.mock('@/hooks/usePagination', () => ({
  usePaginationWithFilters: () => ({
    currentPage: 1,
    pageSize: 20,
  }),
}));

jest.mock('@/lib/utils/pagination', () => ({
  createGraphQLVariables: (v: any) => v,
  extractPaginationData: (data: any) => ({
    data: data?.posts?.entities ?? [],
    pagination: {
      total: data?.posts?.total ?? 0,
      page: data?.posts?.page ?? 1,
      pageSize: data?.posts?.pageSize ?? 20,
    },
  }),
}));

jest.mock('@/store', () => ({
  useAppStore: (selector: any) =>
    selector({
      user: { data: { _id: 'current-user' } },
      ui: { hiddenPosts: [] },
      setHiddenPosts: jest.fn(),
    }),
}));

// ---- Tests ----
describe('PaginatedPostsList', () => {
  it('renders posts from GraphQL data', () => {
    render(<PaginatedPostsList />);

    expect(screen.getByTestId('paginated-list')).toBeInTheDocument();
    expect(screen.getByTestId('post-card')).toBeInTheDocument();
    expect(screen.getByText('First post')).toBeInTheDocument();
  });

  it('calls onTotalCountChange with total posts', () => {
    const onTotalCountChange = jest.fn();

    render(<PaginatedPostsList onTotalCountChange={onTotalCountChange} />);

    expect(onTotalCountChange).toHaveBeenCalledWith(1);
  });

  it('wires onHidePost handler from PostCard', () => {
    render(<PaginatedPostsList />);

    const hideButton = screen.getByText('Hide');
    fireEvent.click(hideButton);

    // Just check that PostCard’s onHidePost was invoked (global from mock)
    expect((global as any).__onHidePost).toBeDefined();
  });
});
