/**
 * ChatTabs Component Tests
 *
 * Chats / Discussions / Buddies as a segmented tab list:
 * - Tab roles, selection and roving tabindex
 * - Arrow, Home and End keys
 * - Incoming buddy request badge on Buddies
 */

import { render, screen, fireEvent } from '@/__tests__/utils/test-utils'
import ChatTabs from '@/components/Chat/ChatTabs'

describe('ChatTabs', () => {
  const onChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders Chats, Discussions and Buddies as tabs, with the active one selected', () => {
    render(<ChatTabs value="groups" onChange={onChange} panelId="chat-tabpanel" />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Chats', 'Discussions', 'Buddies'])
    expect(screen.getByRole('tablist')).toHaveClass('qv-seg')

    const discussions = screen.getByRole('tab', { name: 'Discussions' })
    expect(discussions).toHaveAttribute('aria-selected', 'true')
    expect(discussions).toHaveAttribute('tabindex', '0')
    expect(discussions).toHaveAttribute('aria-controls', 'chat-tabpanel')
    expect(screen.getByRole('tab', { name: 'Chats' })).toHaveAttribute('tabindex', '-1')
  })

  it('calls onChange with the tab that is clicked', () => {
    render(<ChatTabs value="chats" onChange={onChange} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Buddies' }))

    expect(onChange).toHaveBeenCalledWith(expect.anything(), 'buddies')
  })

  it('moves between tabs with the arrow keys, wrapping around', () => {
    render(<ChatTabs value="chats" onChange={onChange} />)
    const chats = screen.getByRole('tab', { name: 'Chats' })

    fireEvent.keyDown(chats, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 'groups')
    expect(screen.getByRole('tab', { name: 'Discussions' })).toHaveFocus()

    fireEvent.keyDown(chats, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 'buddies')
  })

  it('jumps to the first and last tab with Home and End', () => {
    render(<ChatTabs value="groups" onChange={onChange} />)
    const discussions = screen.getByRole('tab', { name: 'Discussions' })

    fireEvent.keyDown(discussions, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 'buddies')

    fireEvent.keyDown(discussions, { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), 'chats')
  })

  it('ignores other keys', () => {
    render(<ChatTabs value="chats" onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Chats' }), { key: 'a' })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('has no badge or counts without buddy requests', () => {
    const { container } = render(<ChatTabs value="chats" onChange={onChange} />)

    expect(container.querySelector('.qv-msg-tab-badge')).toBeNull()
    expect(screen.getByRole('tab', { name: 'Buddies' })).toBeInTheDocument()
  })

  it('badges Buddies with the number of requests and says so to screen readers', () => {
    const { container, rerender } = render(
      <ChatTabs value="chats" onChange={onChange} requestCount={1} />
    )

    expect(screen.getByRole('tab', { name: 'Buddies, 1 request' })).toBeInTheDocument()
    expect(container.querySelectorAll('.qv-msg-tab-badge')).toHaveLength(1)

    rerender(<ChatTabs value="chats" onChange={onChange} requestCount={3} />)
    expect(screen.getByRole('tab', { name: 'Buddies, 3 requests' })).toHaveTextContent('3')

    rerender(<ChatTabs value="chats" onChange={onChange} requestCount={12} />)
    expect(screen.getByRole('tab', { name: 'Buddies, 12 requests' })).toHaveTextContent('9+')
  })
})
