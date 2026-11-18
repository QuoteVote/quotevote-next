/**
 * StatusEditor — "Set Your Status" dialog (#468)
 *
 * - "Online" is now "Available"
 * - Invisible is the default
 * - the Status Message is disabled (and its text hidden) while Invisible
 * - nothing but the user pressing Save changes the status
 */

import { render, screen, fireEvent, waitFor, act } from '../../utils/test-utils'
import StatusEditor from '@/components/Chat/StatusEditor'
import { useAppStore } from '@/store'
import { UPDATE_PRESENCE } from '@/graphql/mutations'
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn() }),
}))

const mockUpdatePresence = jest.fn()
const mockUseMutation = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

const chat = () => useAppStore.getState().chat

function openEditor() {
  const onClose = jest.fn()
  render(<StatusEditor open onClose={onClose} />)
  return onClose
}

const statusSelect = () => screen.getByLabelText('Status') as HTMLSelectElement
const messageField = () => screen.getByLabelText('Status Message') as HTMLTextAreaElement

describe('StatusEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAppStore.getState().resetStore()
    mockUpdatePresence.mockResolvedValue({ data: {} })
    mockUseMutation.mockReturnValue([mockUpdatePresence, { loading: false }])
  })

  it('offers Available, Away, Do Not Disturb and Invisible, and no "Online"', () => {
    openEditor()

    const options = Array.from(statusSelect().options).map((o) => o.textContent)
    expect(options).toEqual(['🟢 Available', '🟡 Away', '🔴 Do Not Disturb', '⚫ Invisible'])
    expect(screen.queryByText(/online/i)).not.toBeInTheDocument()
  })

  it('keeps "online" as the stored value behind Available', () => {
    openEditor()

    const available = Array.from(statusSelect().options).find((o) => o.textContent === '🟢 Available')
    expect(available?.value).toBe('online')
  })

  it('opens on Invisible when no status has been chosen yet', () => {
    openEditor()

    expect(statusSelect().value).toBe('invisible')
  })

  it('disables the Status Message while Invisible and says why', () => {
    openEditor()

    expect(messageField()).toBeDisabled()
    expect(messageField().value).toBe('')
    expect(screen.getByText(/Nobody sees your status or message while you are Invisible/)).toBeInTheDocument()
    expect(screen.queryByText(/characters/)).not.toBeInTheDocument()
  })

  it('enables the Status Message for Available, Away and Do Not Disturb', () => {
    openEditor()

    for (const value of ['online', 'away', 'dnd']) {
      fireEvent.change(statusSelect(), { target: { value } })
      expect(messageField()).toBeEnabled()
      expect(screen.getByText('0/200 characters')).toBeInTheDocument()
    }
  })

  it('opens on the status that was saved earlier', async () => {
    useAppStore.getState().setUserStatus('away', 'Out for lunch')
    openEditor()

    await waitFor(() => expect(statusSelect().value).toBe('away'))
    expect(messageField().value).toBe('Out for lunch')
    expect(messageField()).toBeEnabled()
  })

  it('falls back to Invisible for a value that cannot be chosen (offline)', async () => {
    useAppStore.setState((state) => ({ chat: { ...state.chat, userStatus: 'offline' } }))
    openEditor()

    await waitFor(() => expect(statusSelect().value).toBe('invisible'))
  })

  it('saves Available with a trimmed message and updates the store', async () => {
    const onClose = openEditor()

    fireEvent.change(statusSelect(), { target: { value: 'online' } })
    fireEvent.change(messageField(), { target: { value: '  Ship it  ' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    })

    expect(mockUseMutation).toHaveBeenCalledWith(UPDATE_PRESENCE)
    expect(mockUpdatePresence).toHaveBeenCalledWith({
      variables: { presence: { status: 'online', statusMessage: 'Ship it' } },
    })
    expect(chat().userStatus).toBe('online')
    expect(chat().userStatusMessage).toBe('Ship it')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('saves Invisible with an empty message, even after typing one', async () => {
    const onClose = openEditor()

    fireEvent.change(statusSelect(), { target: { value: 'away' } })
    fireEvent.change(messageField(), { target: { value: 'Secret plans' } })
    fireEvent.change(statusSelect(), { target: { value: 'invisible' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    })

    expect(mockUpdatePresence).toHaveBeenCalledWith({
      variables: { presence: { status: 'invisible', statusMessage: '' } },
    })
    expect(chat().userStatus).toBe('invisible')
    expect(chat().userStatusMessage).toBe('')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps what you typed if you switch to Invisible and back before saving', () => {
    openEditor()

    fireEvent.change(statusSelect(), { target: { value: 'away' } })
    fireEvent.change(messageField(), { target: { value: 'Back at 5' } })
    fireEvent.change(statusSelect(), { target: { value: 'invisible' } })
    expect(messageField().value).toBe('')

    fireEvent.change(statusSelect(), { target: { value: 'away' } })
    expect(messageField().value).toBe('Back at 5')
  })

  it('limits the message to 200 characters', () => {
    openEditor()

    fireEvent.change(statusSelect(), { target: { value: 'online' } })
    fireEvent.change(messageField(), { target: { value: 'x'.repeat(250) } })

    expect(messageField().value).toHaveLength(200)
    expect(screen.getByText('200/200 characters')).toBeInTheDocument()
  })

  it('changes nothing until Save is pressed, and Cancel changes nothing', () => {
    const onClose = openEditor()

    fireEvent.change(statusSelect(), { target: { value: 'dnd' } })
    fireEvent.change(messageField(), { target: { value: 'Busy' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mockUpdatePresence).not.toHaveBeenCalled()
    expect(chat().userStatus).toBe('invisible')
    expect(chat().userStatusLoaded).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps the old status and shows an error when saving fails', async () => {
    mockUpdatePresence.mockRejectedValueOnce(new Error('Network down'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const onClose = openEditor()

    fireEvent.change(statusSelect(), { target: { value: 'online' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    })

    expect(toast.error).toHaveBeenCalledWith('Failed to update status. Please try again.')
    expect(chat().userStatus).toBe('invisible')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows Saving… and blocks double saves while the request runs', () => {
    mockUseMutation.mockReturnValue([mockUpdatePresence, { loading: true }])
    openEditor()

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })
})
