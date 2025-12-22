// src/__tests__/components/PostView.test.tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PostView } from '../../components/Post/PostView';

const mockUseQuery = jest.fn();
jest.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('@/lib/utils/date', () => ({
  formatPostDate: () => 'Formatted date',
}));

const creator = {
  name: 'Alice',
  username: 'alice',
  avatar: { url: '', color: '#000', initials: 'A' },
};

const basePost = {
  _id: 'p1',
  title: 'Sample post',
  text: 'Post body',
  creator,
  created: new Date().toISOString(),
  likesCount: 3,
  commentsCount: 2,
  isLiked: true,
};

describe('PostView', () => {
  const postId = 'p1';

  beforeEach(() => {
    mockUseQuery.mockReset();
    mockBack.mockReset();
  });

  it('renders loading skeleton while loading', () => {
  mockUseQuery.mockReturnValue({
    loading: true,
    error: undefined,
    data: undefined,
  });

  render(<PostView postId={postId} />);

  expect(screen.getByTestId('post-view-loading')).toBeInTheDocument();
});

  it('renders error state when query fails', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: { message: 'Network error' },
      data: undefined,
    });

    render(<PostView postId={postId} />);

    expect(screen.getByText(/Failed to load post/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();
  });

  it('renders "post not found" when no post returned', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { post: null },
    });

    render(<PostView postId={postId} />);

    expect(screen.getByText(/Post not found/i)).toBeInTheDocument();
  });

  it('renders post details when data is available', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { post: basePost },
    });

    render(<PostView postId={postId} />);

    expect(screen.getByText('Sample post')).toBeInTheDocument();
    expect(screen.getByText('Post body')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('Formatted date')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
