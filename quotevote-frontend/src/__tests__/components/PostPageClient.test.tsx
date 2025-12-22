import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PostPageClient } from '../../components/Post/PostPageClient';

const mockSetSelectedPage = jest.fn();

jest.mock('@/store', () => ({
  useAppStore: (selector: any) =>
    selector({
      setSelectedPage: mockSetSelectedPage,
    }),
}));

jest.mock('@/components/Post/PostView', () => ({
  PostView: ({ postId }: { postId: string }) => (
    <div data-testid="post-view" data-post-id={postId}>
      PostView
    </div>
  ),
}));

describe('PostPageClient', () => {
  const postId = 'post-123';

  beforeEach(() => {
    mockSetSelectedPage.mockReset();
  });

  it('renders PostView with given postId', () => {
    const { getByTestId } = render(<PostPageClient postId={postId} />);

    const view = getByTestId('post-view');
    expect(view).toBeInTheDocument();
    expect(view).toHaveAttribute('data-post-id', postId);
  });

  it('resets selected page in store on mount', () => {
    render(<PostPageClient postId={postId} />);

    expect(mockSetSelectedPage).toHaveBeenCalledWith(null);
  });
});
