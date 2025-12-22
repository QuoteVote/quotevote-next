// src/__tests__/components/SelectionPopover.test.tsx
import { render } from '@testing-library/react';
import { SelectionPopover } from '../../components/VotingComponents/SelectionPopover';

describe('SelectionPopover', () => {
  it('renders children when showPopover is true', () => {
    const { container } = render(
      <SelectionPopover
        showPopover={true}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      >
        <div>Popover Content</div>
      </SelectionPopover>
    );
    expect(container.querySelector('#selectionPopover')).toBeVisible();
  });

  it('hides when showPopover is false', () => {
    const { container } = render(
      <SelectionPopover
        showPopover={false}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      >
        <div>Popover Content</div>
      </SelectionPopover>
    );
    expect(container.querySelector('#selectionPopover')).not.toBeVisible();
  });
});
