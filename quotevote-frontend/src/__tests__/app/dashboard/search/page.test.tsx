import { render, screen } from '@testing-library/react';
import SearchPage from '@/app/dashboard/search/page';

// Mock the SubHeader component
jest.mock('@/components/SubHeader', () => ({
  SubHeader: ({ headerName }: { headerName: string }) => (
    <header data-testid="subheader">{headerName}</header>
  ),
}));

// Mock the LoadingSpinner
jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock SearchContainer (uses useSearchParams, needs Suspense)
jest.mock('@/components/SearchContainer/SearchContainer', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="search-container">Search Container</div>
  ),
}));

describe('SearchPage', () => {
  it('should render the page with SubHeader', () => {
    render(<SearchPage />);

    const subheader = screen.getByTestId('subheader');
    expect(subheader).toBeInTheDocument();
    expect(subheader).toHaveTextContent('Search');
  });

  it('should render SearchContainer', async () => {
    render(<SearchPage />);

    // SearchContainer is inside Suspense; in test it renders immediately since mock is sync
    const container = await screen.findByTestId('search-container');
    expect(container).toBeInTheDocument();
  });

  it('should have proper structure with space-y-4 class', () => {
    const { container } = render(<SearchPage />);

    const mainDiv = container.querySelector('.space-y-4');
    expect(mainDiv).toBeInTheDocument();
  });

  it('should have p-4 padding class', () => {
    const { container } = render(<SearchPage />);

    const paddedDiv = container.querySelector('.p-4');
    expect(paddedDiv).toBeInTheDocument();
  });
});
