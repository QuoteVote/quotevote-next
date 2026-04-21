"use client"

import { useEffect, useRef } from 'react'
import { ArrowLeft, Settings, Ban, UserX, Trash2 } from 'lucide-react'
import { useQuery } from '@apollo/client/react'

import MessageSend from './MessageSend'
import MessageItemList from './MessageItemList'
import TypingIndicator from './TypingIndicator'
import { useRosterManagement } from '@/hooks/useRosterManagement'
import useGuestGuard from '@/hooks/useGuestGuard'
import { useAppStore } from '@/store'
import { toast } from 'sonner'
import { GET_CHAT_ROOMS, GET_ROSTER } from '@/graphql/queries'
import Avatar from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ChatRoom, StagedChatRoom } from '@/types/chat'

interface HeaderProps {
  room: ChatRoom | null
}

function Header({ room }: HeaderProps) {
  const currentUser = useAppStore((state) => state.user.data)
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom)

  const { blockBuddy, unblockBuddy, removeBuddy } = useRosterManagement()
  const { refetch: refetchChatRooms } = useQuery<{ messageRooms: ChatRoom[] }>(
    GET_CHAT_ROOMS,
    {
      fetchPolicy: 'cache-and-network',
    },
  )
  const { data: rosterData } = useQuery<{ getRoster: Array<{ _id: string; userId: string; buddyId: string; status: string }> }>(
    GET_ROSTER,
    { skip: !currentUser },
  )

  const title = room?.title ?? 'Chat'
  const messageType = room?.messageType ?? 'USER'
  const users = room?.users ?? []
  const avatar = room?.avatar ?? null

  const currentUserIdForHeader = currentUser?._id?.toString()
  const otherUserId =
    messageType === 'USER' && users.length === 2 && currentUserIdForHeader
      ? users
        .map((id) => {
          if (!id) return null
          try {
            return id.toString()
          } catch {
            return null
          }
        })
        .filter(Boolean)
        .find((id) => id !== currentUserIdForHeader) ?? null
      : null

  const rosterEntries = rosterData?.getRoster ?? []
  const currentUserIdStr = currentUser?._id?.toString()
  const isBlocked = !!(
    otherUserId &&
    currentUserIdStr &&
    rosterEntries.some(
      (r) => r.status === 'blocked' && (
        (r.userId === currentUserIdStr && r.buddyId === otherUserId) ||
        (r.userId === otherUserId && r.buddyId === currentUserIdStr)
      )
    )
  )

  const handleBack = () => {
    setSelectedChatRoom(null)
  }

  const handleBlockUser = async () => {
    if (!otherUserId) return

    try {
      if (isBlocked) {
        await unblockBuddy(otherUserId)
        await refetchChatRooms()
        toast.success('User unblocked successfully')
      } else {
        await blockBuddy(otherUserId)
        await refetchChatRooms()
        toast.success('User blocked successfully. Chat history is preserved, but they cannot send new messages.')
      }
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message ||
        `Failed to ${isBlocked ? 'unblock' : 'block'} user`
      toast.error(message)
    }
  }

  const handleRemoveBuddy = async () => {
    if (!otherUserId) return

    try {
      await removeBuddy(otherUserId)
      await refetchChatRooms()
      toast.success('Buddy removed successfully')
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message || 'Failed to remove buddy'
      toast.error(message)
    }
  }

  const handleDeleteChat = () => {
    setSelectedChatRoom(null)
    toast('Chat closed')
  }

  const isUserRoom = messageType === 'USER'

  return (
    <div className="sticky top-0 z-10 border-b bg-gradient-to-b from-white to-[#fafbfc] px-4 py-3 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:scale-105 transition-all duration-200"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar
            src={typeof avatar === 'string' ? avatar : undefined}
            alt={title || 'Chat avatar'}
            size={44}
            className="flex-shrink-0 ring-2 ring-white shadow-sm"
          />

          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-foreground" style={{ letterSpacing: '-0.01em' }}>
              {title || 'Chat'}
            </div>
            <div className="mt-0.5 text-[0.8125rem] text-muted-foreground">
              {isUserRoom ? 'Direct Message' : 'Group Chat'}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-[#52b274] hover:scale-105 transition-all duration-200"
              aria-label="Chat settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isUserRoom && otherUserId && (
              <>
                <DropdownMenuItem
                  onClick={handleBlockUser}
                  className="text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/40"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  <span>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRemoveBuddy}
                  className="text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/40"
                >
                  <UserX className="mr-2 h-4 w-4" />
                  <span>Remove Buddy</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleDeleteChat}
              className="text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/40"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Close Chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

interface MessageBoxProps {
  roomOverride?: ChatRoom | null
}

function MessageBox({ roomOverride }: MessageBoxProps) {
  const ensureAuth = useGuestGuard()
  const selectedRoomId = useAppStore((state) => state.chat.selectedRoom)
  const isStagedRoom = selectedRoomId !== null && typeof selectedRoomId === 'object'

  const { data: roomsData } = useQuery<{ messageRooms: ChatRoom[] }>(GET_CHAT_ROOMS, {
    fetchPolicy: 'cache-and-network',
    skip: isStagedRoom,
  })

  const room: ChatRoom | null = (() => {
    if (roomOverride) return roomOverride
    if (isStagedRoom) {
      const staged = selectedRoomId as StagedChatRoom
      return {
        // Empty string as sentinel — MessageSend treats falsy messageRoomId as "create new room"
        _id: '',
        title: staged.title,
        avatar: staged.avatar,
        messageType: staged.messageType,
        users: staged.users,
        created: new Date().toISOString(),
      }
    }
    return typeof selectedRoomId === 'string'
      ? (roomsData?.messageRooms.find((r) => r._id === selectedRoomId) ?? null)
      : null
  })()

  const messageRoomId = room?._id ?? null
  const messageType = room?.messageType ?? 'USER'
  const title = room?.title ?? null

  // Track auth requirement for read-related behaviour (currently only used to gate child components)
  const hasAuthRef = useRef(false)
  useEffect(() => {
    hasAuthRef.current = ensureAuth()
  }, [ensureAuth])

  if (!room) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-4 text-center text-sm text-muted-foreground">
        No room selected
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <Header room={room} />
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{
          backgroundColor: '#f7f8fa',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.015) 2px, rgba(0,0,0,0.015) 4px)',
        }}
      >
        <div className="flex-1 overflow-hidden px-2 py-1">
          <MessageItemList room={room} />
        </div>
      </div>
      <div className="border-t bg-gradient-to-t from-white to-[#fafbfc] px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06),0_-1px_4px_rgba(0,0,0,0.04)]">
        <div className="space-y-1">
          {messageRoomId && <TypingIndicator messageRoomId={messageRoomId} />}
          <MessageSend
            messageRoomId={messageRoomId}
            type={messageType ?? 'USER'}
            title={title}
            componentId={null}
          />
        </div>
      </div>
    </div>
  )
}

export default MessageBox
