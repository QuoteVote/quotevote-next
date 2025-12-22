// src/__tests__/components/PostsList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import PostsList from '../../components/Post/PostsList';

const mockUseQuery = jest.fn();
const mockFetchMore = jest.fn();

jest.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

jest.mock('@/components/Post/Post', () => ({
  Post: (props: any) => (
    <div data-testid="post-item">
      <span>{props.post.title}</span>
    </div>
  ),
}));

jest.mock('@/components/Post/PostSkeleton', () => ({
  PostSkeleton: () => <div data-testid="post-skeleton" />,
}));

describe('PostsList', () => {
  const userId = 'user-1';

  beforeEach(() => {
    mockUseQuery.mockReset();
    mockFetchMore.mockReset();
  });

  it('renders skeletons during initial loading', () => {
    mockUseQuery.mockReturnValue({
      loading: true,
      data: undefined,
      fetchMore: mockFetchMore,
    });

    render(<PostsList userId={userId} />);

    expect(screen.getAllByTestId('post-skeleton').length).toBe(3);
  });

  it('renders empty state when no posts', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      data: {
        posts: {
          entities: [],
          pagination: { total_count: 0 },
        },
      },
      fetchMore: mockFetchMore,
    });

    render(<PostsList userId={userId} />);

    expect(screen.getByText(/No posts found/i)).toBeInTheDocument();
  });

  it('renders posts when data is available', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      data: {
        posts: {
          entities: [
            { _id: 'p1', title: 'Post 1' },
            { _id: 'p2', title: 'Post 2' },
          ],
          pagination: { total_count: 2 },
        },
      },
      fetchMore: mockFetchMore,
    });

    render(<PostsList userId={userId} />);

    const items = screen.getAllByTestId('post-item');
    expect(items.length).toBe(2);
    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.getByText('Post 2')).toBeInTheDocument();
  });

  it('shows Load More button when more posts exist and triggers fetchMore', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      data: {
        posts: {
          entities: [
            { _id: 'p1', title: 'Post 1' },
            { _id: 'p2', title: 'Post 2' },
          ],
          pagination: { total_count: 5 }, // more than entities length
        },
      },
      fetchMore: mockFetchMore,
    });

    render(<PostsList userId={userId} />);

    const loadMoreButton = screen.getByRole('button', { name: /Load More Posts/i });
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    expect(mockFetchMore).toHaveBeenCalled();
  });

  it('shows end message when no more posts', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      data: {
        posts: {
          entities: [
            { _id: 'p1', title: 'Post 1' },
            { _id: 'p2', title: 'Post 2' },
          ],
          pagination: { total_count: 2 }, // equal to entities length
        },
      },
      fetchMore: mockFetchMore,
    });

    render(<PostsList userId={userId} />);

    expect(screen.getByText(/You\'ve reached the end/i)).toBeInTheDocument();
  });
});
