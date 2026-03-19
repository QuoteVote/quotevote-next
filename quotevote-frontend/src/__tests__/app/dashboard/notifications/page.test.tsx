import { render, screen } from '@testing-library/react';

// Mock the NotificationsPageContent client component
jest.mock('@/app/dashboard/notifications/NotificationsPageContent', () => ({
  NotificationsPageContent: () => (
    <div data-testid="notifications-content">Notifications Content</div>
  ),
}));

// Import after mocking
import NotificationsPage from '@/app/dashboard/notifications/page';

describe('NotificationsPage', () => {
  it('renders the notifications page content', () => {
    render(<NotificationsPage />);
    expect(screen.getByTestId('notifications-content')).toBeInTheDocument();
  });
});
