import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PostSkeleton } from '../../components/Post/PostSkeleton';

describe('PostSkeleton', () => {
  it('renders a card with skeleton placeholders', () => {
    const { container } = render(<PostSkeleton />);

    // Card wrapper exists
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();

    // Several skeleton elements should be present
    const skeletons = container.querySelectorAll('.animate-pulse, [class*="h-"][class*="w-"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('matches basic structure for header, content and footer', () => {
    const { container } = render(<PostSkeleton />);

    expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-footer"]')).toBeInTheDocument();
  });
});
