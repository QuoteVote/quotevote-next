import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PostCard } from '../../components/Post/PostCard';

jest.mock('@/components/Post/Post', () => ({
  Post: (props: any) => (
    <div data-testid="post-component" data-post-title={props.post.title}>
      Post Component
    </div>
  ),
}));

const basePost: any = {
  _id: 'p1',
  title: 'Wrapped post',
  text: 'Body',
  created: new Date().toISOString(),
  creator: {
    name: 'Alice',
    avatar: { url: '', color: '#000', initials: 'A' },
    username: 'alice',
  },
  userId: 'u1',
  approvedBy: [],
  rejectedBy: [],
  votedBy: [],
  votes: [],
  enable_voting: true,
};

const user = {
  _id: 'current',
  _followingId: [],
  admin: false,
  name: 'Current',
  username: 'current',
};

describe('PostCard', () => {
  it('passes post and user props to Post', () => {
    const { getByTestId } = render(
      <PostCard
        {...basePost}
        user={user}
        postHeight={400}
        postActions={[]}
        refetchPost={jest.fn()}
      />
    );

    const postWrapper = getByTestId('post-component');
    expect(postWrapper).toBeInTheDocument();
    expect(postWrapper).toHaveAttribute('data-post-title', 'Wrapped post');
  });
});
