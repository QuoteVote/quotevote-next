/**
 * Tests for Notification component
 */

import { render, screen } from '@/__tests__/utils/test-utils';
import { Notification } from '../../../components/Notifications/Notification';
import type { Notification as NotificationType } from '@/types/notification';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock useResponsive
const mockUseResponsive = jest.fn(() => ({
  isMobile: false,
}));
jest.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockUseResponsive(),
}));

// Mock NotificationLists to avoid complex dependencies
jest.mock('../../../components/Notifications/NotificationLists', () => ({
  NotificationLists: ({ notifications }: { notifications: unknown[] }) => (
    <div data-testid="notification-lists">
      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        notifications.map((n: unknown, index: number) => {
          const notification = n as { _id: string; label: string };
          return <div key={notification._id || index}>{notification.label}</div>;
        })
      )}
    </div>
  ),
}));

const mockNotifications: NotificationType[] = [
  {
    _id: '1',
    userId: 'user1',
    userIdBy: 'user2',
    userBy: {
      _id: 'user2',
      name: 'Test User',
      username: 'testuser',
      avatar: { url: '/avatar.jpg' },
    },
    label: 'Test notification',
    status: 'unread',
    created: new Date().toISOString(),
    notificationType: 'COMMENTED',
    post: {
      _id: 'post1',
      url: '/post/1',
    },
  },
];

describe('Notification', () => {
  it('should render loading skeletons when loading is true', () => {
    const { container } = render(
      <Notification loading={true} notifications={[]} />
    );

    // Check for skeleton elements by class name
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render notification lists when not loading', () => {
    render(
      <Notification loading={false} notifications={mockNotifications} />
    );

    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should not render title on mobile', () => {
    mockUseResponsive.mockReturnValueOnce({
      isMobile: true,
    });

    render(
      <Notification loading={false} notifications={mockNotifications} />
    );

    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('should render open notifications button when not in pageView', () => {
    render(
      <Notification
        loading={false}
        notifications={mockNotifications}
        pageView={false}
      />
    );

    const button = screen.getByLabelText('Open Notifications');
    expect(button).toBeInTheDocument();
  });

  it('should not render open button when in pageView', () => {
    render(
      <Notification
        loading={false}
        notifications={mockNotifications}
        pageView={true}
      />
    );

    const button = screen.queryByLabelText('Open Notifications');
    expect(button).not.toBeInTheDocument();
  });
});

