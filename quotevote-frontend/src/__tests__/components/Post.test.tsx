// src/__tests__/components/Post.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Post } from '../../components/Post/Post';

// ---- Mocks ----
jest.mock('@apollo/client/react', () => ({
  useMutation: () => [jest.fn()],
  useQuery: () => ({ loading: false, data: { users: [] }, error: undefined }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('clipboard-copy', () => jest.fn());
import copy from 'clipboard-copy';

jest.mock('@/store', () => ({
  useAppStore: (selector: any) =>
    selector({
      setSnackbar: jest.fn(),
      user: { data: { admin: false } },
    }),
}));

jest.mock('@/lib/utils/auth', () => ({
  tokenValidator: () => true,
}));

jest.mock('@/lib/utils/objectIdSerializer', () => ({
  serializeVotedBy: (v: unknown) => v,
}));

jest.mock('@/components/VotingComponents/VotingBoard', () => ({
  VotingBoard: ({ children, content }: any) => (
    <div data-testid="voting-board">
      <div>{content}</div>
      {children({ text: 'selected text', startIndex: 0, endIndex: 3, points: 1 })}
    </div>
  ),
}));

jest.mock('@/components/VotingComponents/VotingPopup', () => ({
  VotingPopup: () => <div data-testid="voting-popup" />,
}));

jest.mock('@/components/CustomButtons/FollowButton', () => ({
  FollowButton: () => <button>Follow</button>,
}));

jest.mock('@/components/CustomButtons/BookmarkIconButton', () => ({
  BookmarkIconButton: () => <button>Bookmark</button>,
}));

jest.mock('@/components/CustomButtons/ApproveButton', () => ({
  ApproveButton: (props: any) => <button {...props}>Approve</button>,
}));

jest.mock('@/components/CustomButtons/RejectButton', () => ({
  RejectButton: (props: any) => <button {...props}>Reject</button>,
}));

jest.mock('@/components/RequestInviteDialog', () => ({
  RequestInviteDialog: ({ open }: { open: boolean }) =>
    open ? <div>Invite Dialog</div> : null,
}));

// ---- Test data ----
const basePost: any = {
  _id: 'post-1',
  title: 'Test Post Title',
  text: 'This is the body of the post.',
  created: new Date().toISOString(),
  creator: {
    name: 'Alice',
    avatar: { url: '', color: '#000', initials: 'A' },
    username: 'alice',
  },
  userId: 'user-1',
  approvedBy: [],
  rejectedBy: [],
  votedBy: [],
  votes: [],
  enable_voting: true,
};

const baseUser: any = {
  _id: 'user-2',
  admin: false,
  _followingId: [],
};

const defaultProps = {
  post: basePost,
  user: baseUser,
  postHeight: 400,
  postActions: [],
  refetchPost: jest.fn(),
};

// ---- Tests ----
describe('Post', () => {
  it('renders title, author and content', () => {
    render(<Post {...defaultProps} />);

    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('This is the body of the post.')).toBeInTheDocument();
  });

  it('renders voting board and popup', () => {
    render(<Post {...defaultProps} />);

    expect(screen.getByTestId('voting-board')).toBeInTheDocument();
    expect(screen.getByTestId('voting-popup')).toBeInTheDocument();
  });

  it('renders follow and bookmark buttons', () => {
    render(<Post {...defaultProps} />);

    expect(screen.getByText('Follow')).toBeInTheDocument();
    expect(screen.getByText('Bookmark')).toBeInTheDocument();
  });

  it('copies URL when copy button is clicked', () => {
    render(<Post {...defaultProps} />);

    // Find the header icon button with the link icon
    const allButtons = screen.getAllByRole('button');
    const copyButton = allButtons.find((btn) =>
      btn.querySelector('svg.lucide-link')
    ) as HTMLButtonElement;

    expect(copyButton).toBeDefined();
    fireEvent.click(copyButton);

    expect(copy).toHaveBeenCalled();
  });

  it('shows voted alert when user has voted', () => {
    const votedPost = {
      ...basePost,
      votedBy: [{ userId: baseUser._id, type: 'up', deleted: false }],
    };

    render(<Post {...defaultProps} post={votedPost} />);

    expect(
      screen.getByText(/You have already upvoted this post/i)
    ).toBeInTheDocument();
  });
});
