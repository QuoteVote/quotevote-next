/**
 * ProfileAvatar Component Tests
 */

import { render } from '../../utils/test-utils';
import { ProfileAvatar } from '../../../components/Profile/ProfileAvatar';
import { useAppStore } from '@/store';

jest.mock('../../../components/DisplayAvatar', () => ({
  DisplayAvatar: ({ avatar, username, size }: { avatar?: unknown; username?: string; size?: number }) => (
    <div
      data-testid="display-avatar"
      data-avatar={JSON.stringify(avatar)}
      data-username={username}
      data-size={String(size)}
    >
      DisplayAvatar
    </div>
  ),
}));

describe('ProfileAvatar', () => {
  beforeEach(() => {
    useAppStore.setState({
      user: { loading: false, loginError: null, data: {} },
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<ProfileAvatar />);
    expect(container).toBeInTheDocument();
  });

  it('renders with default size (md → 40px)', () => {
    const { getByTestId } = render(<ProfileAvatar />);
    expect(getByTestId('display-avatar')).toHaveAttribute('data-size', '40');
  });

  it('renders with lg size (64px)', () => {
    const { getByTestId } = render(<ProfileAvatar size="lg" />);
    expect(getByTestId('display-avatar')).toHaveAttribute('data-size', '64');
  });

  it('renders with numeric size', () => {
    const { getByTestId } = render(<ProfileAvatar size={80} />);
    expect(getByTestId('display-avatar')).toHaveAttribute('data-size', '80');
  });

  it('passes username from store to DisplayAvatar', () => {
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: { username: 'testuser' },
      },
    });
    const { getByTestId } = render(<ProfileAvatar />);
    expect(getByTestId('display-avatar')).toHaveAttribute('data-username', 'testuser');
  });

  it('passes avatar qualities object to DisplayAvatar', () => {
    const qualities = { topType: 'ShortHairShortFlat', skinColor: 'Light' };
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        // @ts-expect-error - avatar as object in test
        data: { avatar: qualities },
      },
    });
    const { getByTestId } = render(<ProfileAvatar />);
    expect(getByTestId('display-avatar')).toHaveAttribute(
      'data-avatar',
      JSON.stringify(qualities)
    );
  });

  it('passes string avatar URL to DisplayAvatar', () => {
    useAppStore.setState({
      user: {
        loading: false,
        loginError: null,
        data: { avatar: 'https://example.com/avatar.jpg' },
      },
    });
    const { getByTestId } = render(<ProfileAvatar />);
    expect(getByTestId('display-avatar')).toHaveAttribute(
      'data-avatar',
      '"https://example.com/avatar.jpg"'
    );
  });

  it('renders without avatar (shows default cartoon)', () => {
    const { getByTestId } = render(<ProfileAvatar />);
    // Should still render — DisplayAvatar will generate a default
    expect(getByTestId('display-avatar')).toBeInTheDocument();
  });
});
