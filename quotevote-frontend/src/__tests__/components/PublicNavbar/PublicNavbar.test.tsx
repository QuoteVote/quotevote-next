import { render, screen } from '../../utils/test-utils';
import { PublicNavbar } from '@/components/PublicNavbar/PublicNavbar';

describe('PublicNavbar', () => {
  it('renders an About link pointing to /about', () => {
    render(<PublicNavbar />);
    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});
