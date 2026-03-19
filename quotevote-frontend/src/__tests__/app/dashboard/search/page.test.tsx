import { render, screen } from '@testing-library/react';
import SearchPage from '@/app/dashboard/search/page';

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
  it('should render SearchContainer', async () => {
    render(<SearchPage />);

    const container = await screen.findByTestId('search-container');
    expect(container).toBeInTheDocument();
  });

  it('should render the welcome hero section', () => {
    render(<SearchPage />);

    expect(screen.getByText('Discover Ideas')).toBeInTheDocument();
  });

  it('should render quick action cards', () => {
    render(<SearchPage />);

    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });
});
