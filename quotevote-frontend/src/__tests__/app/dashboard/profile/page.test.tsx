import { render, screen } from '@testing-library/react';
import ProfilePage from '@/app/dashboard/profile/page';

// Mock the components used in ProfilePage
jest.mock('@/components/SubHeader', () => ({
  SubHeader: ({ headerName }: { headerName: string }) => (
    <header data-testid="subheader">{headerName}</header>
  ),
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('@/components/Profile/ProfileController', () => ({
  ProfileController: () => (
    <div data-testid="profile-controller">Profile Controller</div>
  ),
}));

describe('ProfilePage', () => {
  it('should render the page with SubHeader', () => {
    render(<ProfilePage />);
    
    const subheader = screen.getByTestId('subheader');
    expect(subheader).toBeInTheDocument();
    expect(subheader).toHaveTextContent('Profile');
  });

  it('should render ProfileController', () => {
    render(<ProfilePage />);
    
    const profileController = screen.getByTestId('profile-controller');
    expect(profileController).toBeInTheDocument();
  });

  it('should have proper structure with space-y-4 class', () => {
    const { container } = render(<ProfilePage />);
    
    const mainDiv = container.querySelector('.space-y-4');
    expect(mainDiv).toBeInTheDocument();
  });
});
