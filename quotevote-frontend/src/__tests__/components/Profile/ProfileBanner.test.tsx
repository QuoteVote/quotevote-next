/**
 * ProfileBanner (redesign): another member's banner is the default green zigzag,
 * your own uses your saved colour and pattern; on phones it holds the menu button.
 */

import { fireEvent, render, screen } from '../../utils/test-utils';
import { ProfileBanner } from '@/components/Profile/ProfileBanner';
import { useAppStore } from '@/store';
import { OPEN_ACCOUNT_MENU_EVENT } from '@/lib/constants/accountMenu';

const CUSTOM_BG = { color: '#ec4899', pattern: 'dots' as const };
jest.mock('@/hooks/useProfileBackground', () => ({
  useProfileBackground: () => CUSTOM_BG,
}));

function signIn(signedIn: boolean) {
  useAppStore.setState({
    user: {
      loading: false,
      loginError: null,
      data: signedIn ? { _id: 'me', username: 'me' } : {},
    },
  });
}

describe('ProfileBanner', () => {
  beforeEach(() => signIn(true));

  it("shows the default green zigzag on another member's profile", () => {
    render(<ProfileBanner own={false} />);
    const cover = screen.getByTestId('profile-cover');
    // #0f7d56 → rgb(15, 125, 86)
    expect(cover).toHaveStyle({ backgroundColor: 'rgb(15, 125, 86)' });
  });

  it('uses your saved banner on your own profile', () => {
    render(<ProfileBanner own />);
    expect(screen.getByTestId('profile-cover')).toHaveStyle({ backgroundColor: 'rgb(236, 72, 153)' });
  });

  it('opens the account menu from the banner button', () => {
    const listener = jest.fn();
    window.addEventListener(OPEN_ACCOUNT_MENU_EVENT, listener);
    render(<ProfileBanner own />);
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(OPEN_ACCOUNT_MENU_EVENT, listener);
  });

  it('has no menu button for guests', () => {
    signIn(false);
    render(<ProfileBanner own={false} />);
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
  });
});
