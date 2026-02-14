import { render, screen } from '@testing-library/react';
import SearchPage from '@/app/dashboard/search/page';

// Mock the components used in SearchPage
jest.mock('@/components/SubHeader', () => ({
  SubHeader: ({ headerName }: { headerName: string }) => (
    <header data-testid="subheader">{headerName}</header>
  ),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('@/components/SearchContainer', () => ({
  SidebarSearchView: ({ Display }: { Display: string }) => (
    <div data-testid="sidebar-search-view" data-display={Display}>
      Search View
    </div>
  ),
}));

describe('SearchPage', () => {
  it('should render the page with SubHeader', () => {
    render(<SearchPage />);
    
    const subheader = screen.getByTestId('subheader');
    expect(subheader).toBeInTheDocument();
    expect(subheader).toHaveTextContent('Search');
  });

  it('should render SidebarSearchView with correct display prop', () => {
    render(<SearchPage />);
    
    const searchView = screen.getByTestId('sidebar-search-view');
    expect(searchView).toBeInTheDocument();
    expect(searchView).toHaveAttribute('data-display', 'block');
  });

  it('should have proper structure with space-y-4 class', () => {
    const { container } = render(<SearchPage />);
    
    const mainDiv = container.querySelector('.space-y-4');
    expect(mainDiv).toBeInTheDocument();
  });

  it('should wrap content in max-w-4xl container', () => {
    const { container } = render(<SearchPage />);
    
    const maxWidthDiv = container.querySelector('.max-w-4xl');
    expect(maxWidthDiv).toBeInTheDocument();
  });
});
