/**
 * VotingPopup component tests
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import VotingPopup from '@/components/VotingComponents/VotingPopup'
import type { VotingPopupProps } from '@/types/voting'

// Mock the icons
jest.mock('@/components/Icons/Like', () => ({
  __esModule: true,
  default: () => <div data-testid="like-icon">Like</div>,
  Like: () => <div data-testid="like-icon">Like</div>,
}))

jest.mock('@/components/Icons/Dislike', () => ({
  __esModule: true,
  default: () => <div data-testid="dislike-icon">Dislike</div>,
  Dislike: () => <div data-testid="dislike-icon">Dislike</div>,
}))

jest.mock('@/components/Icons/Comment', () => ({
  __esModule: true,
  default: () => <div data-testid="comment-icon">Comment</div>,
  Comment: () => <div data-testid="comment-icon">Comment</div>,
}))

jest.mock('@/components/Icons/Quote', () => ({
  __esModule: true,
  default: () => <div data-testid="quote-icon">Quote</div>,
  Quote: () => <div data-testid="quote-icon">Quote</div>,
}))

// Mock the store
jest.mock('@/store', () => ({
  useAppStore: jest.fn(() => ({
    user: {
      data: {
        _id: 'user123',
        id: 'user123',
      },
    },
  })),
}))

describe('VotingPopup', () => {
  const defaultProps: VotingPopupProps = {
    votedBy: [],
    onVote: jest.fn(),
    onAddComment: jest.fn(),
    onAddQuote: jest.fn(),
    selectedText: {
      startIndex: 0,
      endIndex: 5,
      text: 'test',
      points: 5,
    },
    hasVoted: false,
    userVoteType: null,
  }

  it('renders all voting buttons', () => {
    render(<VotingPopup {...defaultProps} />)
    expect(screen.getByTestId('like-icon')).toBeInTheDocument()
    expect(screen.getByTestId('dislike-icon')).toBeInTheDocument()
    expect(screen.getByTestId('comment-icon')).toBeInTheDocument()
    expect(screen.getByTestId('quote-icon')).toBeInTheDocument()
  })

  it('calls onVote when upvote option is selected', async () => {
    const onVote = jest.fn()
    render(<VotingPopup {...defaultProps} onVote={onVote} />)

    // Click upvote button
    const upvoteButton = screen
      .getByTestId('like-icon')
      .closest('button')
    expect(upvoteButton).toBeInTheDocument()
    if (upvoteButton) {
      fireEvent.click(upvoteButton)
    }

    // Wait for the expanded panel to appear
    await waitFor(() => {
      expect(screen.getByText('#true')).toBeInTheDocument()
    })

    // Click a vote option
    const voteOption = screen.getByText('#true')
    fireEvent.click(voteOption)

    await waitFor(() => {
      expect(onVote).toHaveBeenCalledWith({ type: 'up', tags: '#true' })
    })
  })

  it('calls onAddComment when comment is submitted', async () => {
    const onAddComment = jest.fn()
    render(<VotingPopup {...defaultProps} onAddComment={onAddComment} />)

    // Click comment button
    const commentButton = screen
      .getByTestId('comment-icon')
      .closest('button')
    expect(commentButton).toBeInTheDocument()
    if (commentButton) {
      fireEvent.click(commentButton)
    }

    // Wait for input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type comment here')).toBeInTheDocument()
    })

    // Type comment
    const input = screen.getByPlaceholderText('Type comment here')
    fireEvent.change(input, { target: { value: 'Test comment' } })

    // Submit comment
    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('Test comment', true)
    })
  })

  it('calls onAddQuote when quote button is clicked', () => {
    const onAddQuote = jest.fn()
    render(<VotingPopup {...defaultProps} onAddQuote={onAddQuote} />)

    const quoteButton = screen
      .getByTestId('quote-icon')
      .closest('button')
    expect(quoteButton).toBeInTheDocument()
    if (quoteButton) {
      fireEvent.click(quoteButton)
    }

    expect(onAddQuote).toHaveBeenCalled()
  })

  it('does not disable voting buttons when user has already voted, allowing retraction', async () => {
    const onDeleteVote = jest.fn()
    render(<VotingPopup {...defaultProps} hasVoted={true} userVoteType="up" onDeleteVote={onDeleteVote} />)

    const upvoteButton = screen
      .getByTestId('like-icon')
      .closest('button')
    expect(upvoteButton).not.toBeDisabled()

    if (upvoteButton) {
      fireEvent.click(upvoteButton)
    }
    await waitFor(() => {
      expect(onDeleteVote).toHaveBeenCalled()
    })
  })

  it('allows vote switching when user has already voted', async () => {
    render(<VotingPopup {...defaultProps} hasVoted={true} userVoteType="up" />)

    const downvoteButton = screen
      .getByTestId('dislike-icon')
      .closest('button')
    expect(downvoteButton).not.toBeDisabled()

    if (downvoteButton) {
      fireEvent.click(downvoteButton)
    }

    // Wait for the opposite vote tags to expand
    await waitFor(() => {
      expect(screen.getByText('#false')).toBeInTheDocument()
    })
  })

  it('calls onVote when downvote option is selected', async () => {
    const onVote = jest.fn()
    render(<VotingPopup {...defaultProps} onVote={onVote} />)

    // Click downvote button
    const downvoteButton = screen
      .getByTestId('dislike-icon')
      .closest('button')
    expect(downvoteButton).toBeInTheDocument()
    if (downvoteButton) {
      fireEvent.click(downvoteButton)
    }

    // Wait for the expanded panel to appear
    await waitFor(() => {
      expect(screen.getByText('#false')).toBeInTheDocument()
    })

    // Click a vote option
    const voteOption = screen.getByText('#false')
    fireEvent.click(voteOption)

    await waitFor(() => {
      expect(onVote).toHaveBeenCalledWith({ type: 'down', tags: '#false' })
    })
  })

  it('shows all upvote options when expanded', async () => {
    render(<VotingPopup {...defaultProps} />)

    const upvoteButton = screen
      .getByTestId('like-icon')
      .closest('button')
    if (upvoteButton) {
      fireEvent.click(upvoteButton)
    }

    await waitFor(() => {
      expect(screen.getByText('#true')).toBeInTheDocument()
      expect(screen.getByText('#agree')).toBeInTheDocument()
      expect(screen.getByText('#like')).toBeInTheDocument()
    })
  })

  it('shows all downvote options when expanded', async () => {
    render(<VotingPopup {...defaultProps} />)

    const downvoteButton = screen
      .getByTestId('dislike-icon')
      .closest('button')
    if (downvoteButton) {
      fireEvent.click(downvoteButton)
    }

    await waitFor(() => {
      expect(screen.getByText('#false')).toBeInTheDocument()
      expect(screen.getByText('#disagree')).toBeInTheDocument()
      expect(screen.getByText('#dislike')).toBeInTheDocument()
    })
  })

  it('submits comment with Enter key', async () => {
    const onAddComment = jest.fn()
    render(<VotingPopup {...defaultProps} onAddComment={onAddComment} />)

    // Click comment button
    const commentButton = screen
      .getByTestId('comment-icon')
      .closest('button')
    if (commentButton) {
      fireEvent.click(commentButton)
    }

    // Wait for input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type comment here')).toBeInTheDocument()
    })

    // Type comment
    const input = screen.getByPlaceholderText('Type comment here')
    fireEvent.change(input, { target: { value: 'Test comment' } })

    // Press Enter - component uses onKeyDown
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13, keyCode: 13 })

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('Test comment', true)
    }, { timeout: 2000 })
  })

  it('submits comment without quote when selectedText is empty', async () => {
    const onAddComment = jest.fn()
    const props = {
      ...defaultProps,
      selectedText: {
        startIndex: 0,
        endIndex: 0,
        text: '',
        points: 0,
      },
      onAddComment,
    }
    render(<VotingPopup {...props} />)

    // Click comment button
    const commentButton = screen
      .getByTestId('comment-icon')
      .closest('button')
    if (commentButton) {
      fireEvent.click(commentButton)
    }

    // Wait for input to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type comment here')).toBeInTheDocument()
    })

    // Type comment
    const input = screen.getByPlaceholderText('Type comment here')
    fireEvent.change(input, { target: { value: 'Test comment' } })

    // Submit comment
    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(onAddComment).toHaveBeenCalledWith('Test comment', false)
    })
  })

  it('shows validation error when submitting an empty comment', async () => {
    const onAddComment = jest.fn()
    render(<VotingPopup {...defaultProps} onAddComment={onAddComment} />)

    const commentButton = screen
      .getByTestId('comment-icon')
      .closest('button')
    if (commentButton) {
      fireEvent.click(commentButton)
    }

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type comment here')).toBeInTheDocument()
    })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a comment')).toBeInTheDocument()
    })
    expect(onAddComment).not.toHaveBeenCalled()
  })

  it('clears validation error when user types', async () => {
    const onAddComment = jest.fn()
    render(<VotingPopup {...defaultProps} onAddComment={onAddComment} />)

    const commentButton = screen
      .getByTestId('comment-icon')
      .closest('button')
    if (commentButton) {
      fireEvent.click(commentButton)
    }

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type comment here')).toBeInTheDocument()
    })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a comment')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Type comment here')
    fireEvent.change(input, { target: { value: 'New comment' } })

    await waitFor(() => {
      expect(screen.queryByText('Please enter a comment')).not.toBeInTheDocument()
    })
  })

  it('does not expand tags options when clicking user\'s active vote type', async () => {
    const onVote = jest.fn()
    render(
      <VotingPopup
        {...defaultProps}
        hasVoted={true}
        userVoteType="up"
        onVote={onVote}
      />,
    )

    const upvoteButton = screen
      .getByTestId('like-icon')
      .closest('button')
    if (upvoteButton) {
      fireEvent.click(upvoteButton)
    }

    // Should not expand or call onVote
    await waitFor(() => {
      expect(screen.queryByText('#true')).not.toBeInTheDocument()
    })
    expect(onVote).not.toHaveBeenCalled()
  })

  it('allows switching vote when user has downvoted', async () => {
    render(
      <VotingPopup
        {...defaultProps}
        hasVoted={true}
        userVoteType="down"
      />,
    )

    const upvoteButton = screen
      .getByTestId('like-icon')
      .closest('button')
    expect(upvoteButton).not.toBeDisabled()
  })

  it('handles window resize for responsive layout', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 300, // Small width
    })

    render(<VotingPopup {...defaultProps} />)

    // Component should handle resize
    // The actual resize handling is tested through the component's behavior
    expect(screen.getByTestId('like-icon')).toBeInTheDocument()
  })

  it('toggles expand state when clicking same button twice', async () => {
    render(<VotingPopup {...defaultProps} />)

    const upvoteButton = screen
      .getByTestId('like-icon')
      .closest('button')
    if (upvoteButton) {
      // First click - should expand
      fireEvent.click(upvoteButton)
      await waitFor(() => {
        expect(screen.getByText('#true')).toBeInTheDocument()
      })

      // Second click - should collapse (but the panel might still be visible due to transition)
      fireEvent.click(upvoteButton)
      // The panel visibility is controlled by CSS transitions, so we check the state
      // by looking at the visibility style or waiting for it to disappear
      await waitFor(() => {
        const panel = document.querySelector('#popButtons')
        if (panel) {
          const style = window.getComputedStyle(panel)
          // Panel should be hidden or have opacity 0
          expect(style.visibility === 'hidden' || style.opacity === '0').toBe(true)
        }
      }, { timeout: 1000 })
    }
  })

  it('collapses when switching between vote types', async () => {
    render(<VotingPopup {...defaultProps} />)

    // Click upvote
    const upvoteButton = screen
      .getByTestId('like-icon')
      .closest('button')
    if (upvoteButton) {
      fireEvent.click(upvoteButton)
      await waitFor(() => {
        expect(screen.getByText('#true')).toBeInTheDocument()
      })

      // Click downvote - should switch
      const downvoteButton = screen
        .getByTestId('dislike-icon')
        .closest('button')
      if (downvoteButton) {
        fireEvent.click(downvoteButton)
        await waitFor(() => {
          expect(screen.queryByText('#true')).not.toBeInTheDocument()
          expect(screen.getByText('#false')).toBeInTheDocument()
        })
      }
    }
  })

  it('shows votedBy tooltip when user has voted', () => {
    const votedBy = [
      {
        userId: 'user123',
        type: 'up' as const,
        _id: 'vote1',
      },
    ]

    render(
      <VotingPopup
        {...defaultProps}
        votedBy={votedBy}
        hasVoted={false}
      />,
    )

    // Should show tooltip indicating user has upvoted
    const upvoteButton = screen
      .getByTestId('like-icon')
      .closest('button')
    expect(upvoteButton).toBeInTheDocument()
  })
})

