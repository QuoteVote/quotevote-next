/**
 * ProfileAvatar Component Tests
 * 
 * Tests for the ProfileAvatar component including:
 * - Rendering with different sizes
 * - Avatar source handling
 * - Store integration
 */

import { render } from '../../utils/test-utils';
import { ProfileAvatar } from '../../../components/Profile/ProfileAvatar';
import { useAppStore } from '@/store';

// Mock the Avatar component (default export)
jest.mock('../../../components/Avatar', () => ({
  __esModule: true,
  default: ({ src, alt, size }: { src?: string; alt?: string; size?: string | number }) => (
    <div data-testid="avatar" data-src={src} data-alt={alt} data-size={String(size)}>
      Avatar
    </div>
  ),
}));

describe('ProfileAvatar', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: {},
      },
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<ProfileAvatar />);
    expect(container).toBeInTheDocument();
  });

  it('renders with default size', () => {
    const { getByTestId } = render(<ProfileAvatar />);
    const avatar = getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-size', 'md');
  });

  it('renders with custom size', () => {
    const { getByTestId } = render(<ProfileAvatar size="lg" />);
    const avatar = getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-size', 'lg');
  });

  it('handles string avatar from store', () => {
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: {
          avatar: 'https://example.com/avatar.jpg',
        },
      },
    });

    const { getByTestId } = render(<ProfileAvatar />);
    const avatar = getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-src', 'https://example.com/avatar.jpg');
  });

    it('handles object avatar with url from store', () => {
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: {
            // @ts-expect-error - Testing avatar as object even though store type is string
            avatar: {
              url: 'https://example.com/avatar.jpg',
            },
          },
        },
      });

    const { getByTestId } = render(<ProfileAvatar />);
    const avatar = getByTestId('avatar');
    expect(avatar).toHaveAttribute('data-src', 'https://example.com/avatar.jpg');
  });

    it('handles missing avatar gracefully', () => {
      useAppStore.setState({
        user: {
          loading: false,
          loginError: null,
          data: {},
        },
      });

      const { getByTestId } = render(<ProfileAvatar />);
      const avatar = getByTestId('avatar');
      // Avatar src can be undefined or empty string
      const src = avatar.getAttribute('data-src');
      expect(src === '' || src === null || src === undefined).toBe(true);
    });
});

