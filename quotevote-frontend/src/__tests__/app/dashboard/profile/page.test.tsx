import { render, screen } from '@testing-library/react';
import ProfilePage from '@/app/(dashboard)/profile/page';

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
  it('has no page sub-header: the profile banner leads (redesign)', () => {
    render(<ProfilePage />);
    expect(screen.queryByTestId('subheader')).not.toBeInTheDocument();
  });

  it('should render ProfileController', () => {
    render(<ProfilePage />);
    
    const profileController = screen.getByTestId('profile-controller');
    expect(profileController).toBeInTheDocument();
  });

  it('renders only the profile itself', () => {
    const { container } = render(<ProfilePage />);
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'profile-controller');
  });
});
