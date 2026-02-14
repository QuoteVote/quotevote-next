import { render, screen } from '@testing-library/react';
import PostsPage from '@/app/dashboard/post/page';

// Mock the components used in PostsPage
jest.mock('@/components/SubHeader', () => ({
  SubHeader: ({ headerName }: { headerName: string }) => (
    <header data-testid="subheader">{headerName}</header>
  ),
}));

jest.mock('@/components/Post/PostSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="post-skeleton">Loading post...</div>,
}));

jest.mock('@/components/Post/PaginatedPostsList', () => ({
  __esModule: true,
  default: ({
    defaultPageSize,
    showPageInfo,
    showFirstLast,
    maxVisiblePages,
  }: {
    defaultPageSize: number;
    showPageInfo: boolean;
    showFirstLast: boolean;
    maxVisiblePages: number;
  }) => (
    <div
      data-testid="paginated-posts-list"
      data-page-size={defaultPageSize}
      data-show-page-info={showPageInfo}
      data-show-first-last={showFirstLast}
      data-max-visible-pages={maxVisiblePages}
    >
      Posts List
    </div>
  ),
}));

describe('PostsPage', () => {
  it('should render the page with SubHeader', () => {
    render(<PostsPage />);
    
    const subheader = screen.getByTestId('subheader');
    expect(subheader).toBeInTheDocument();
    expect(subheader).toHaveTextContent('Posts');
  });

  it('should render PaginatedPostsList with correct props', () => {
    render(<PostsPage />);
    
    const postsList = screen.getByTestId('paginated-posts-list');
    expect(postsList).toBeInTheDocument();
    expect(postsList).toHaveAttribute('data-page-size', '20');
    expect(postsList).toHaveAttribute('data-show-page-info', 'true');
    expect(postsList).toHaveAttribute('data-show-first-last', 'true');
    expect(postsList).toHaveAttribute('data-max-visible-pages', '5');
  });

  it('should have proper structure with space-y-4 class', () => {
    const { container } = render(<PostsPage />);
    
    const mainDiv = container.querySelector('.space-y-4');
    expect(mainDiv).toBeInTheDocument();
  });
});
