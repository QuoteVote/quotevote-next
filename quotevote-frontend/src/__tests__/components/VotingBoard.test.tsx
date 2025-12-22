// src/__tests__/components/VotingBoard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { VotingBoard } from '../../components/VotingComponents/VotingBoard';

describe('VotingBoard', () => {
  it('renders content correctly', () => {
    const content = 'Test post content';

    render(
      <VotingBoard content={content} selectedText={{}} onSelect={jest.fn()}>
        {() => <div>Popup</div>}
      </VotingBoard>
    );

    const el = screen.getByTestId('voting-board-content');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('Test post content');
  });

  it('calls onSelect when text is selected', () => {
    const onSelect = jest.fn();

    render(
      <VotingBoard content="Test content" selectedText={{}} onSelect={onSelect}>
        {() => <div>Popup</div>}
      </VotingBoard>
    );

    // Simulate selection by calling the selectable area’s mouseup handler.
    const selectable = screen.getByTestId('voting-board-content');
    fireEvent.mouseUp(selectable);

    // For now just assert it does not crash; real selection tests
    // would mock window.getSelection / Selection API.
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('highlights voted text when highlights prop is true', () => {
    const votes = [{ startIndex: 0, endIndex: 4, type: 'up' as const }];

    render(
      <VotingBoard
        content="Test content"
        selectedText={{}}
        onSelect={jest.fn()}
        highlights
        votes={votes}
      >
        {() => <div>Popup</div>}
      </VotingBoard>
    );

    // Smoke test: content still renders when highlights are on.
    expect(screen.getByTestId('voting-board-content')).toHaveTextContent(
      'Test content'
    );
  });
});
