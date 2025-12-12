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
import type { ChatRoom } from '@/types/chat'

interface HeaderProps {
  room: ChatRoom | null
}

function Header({ room }: HeaderProps) {
  const currentUser = useAppStore((state) => state.user.data)
  const setSelectedChatRoom = useAppStore((state) => state.setSelectedChatRoom)
  const setSnackbar = useAppStore((state) => state.setSnackbar)

  const { blockBuddy, unblockBuddy, removeBuddy } = useRosterManagement()
  const { data: roomsData, refetch: refetchChatRooms } = useQuery<{ messageRooms: ChatRoom[] }>(
    GET_CHAT_ROOMS,
    {
      fetchPolicy: 'cache-and-network',
    },
  )
  const { data: rosterData } = useQuery<{ roster: { blockedUsers?: Array<{ id?: string }> } }>(
    GET_ROSTER,
    { skip: !currentUser },
  )

  const title = room?.title ?? 'Chat'
  const messageType = room?.messageType ?? 'USER'
  const users = room?.users ?? []
  const avatar = room?.avatar ?? null
  const messageRoomId = room?._id ?? null

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

  const blockedUsers = rosterData?.roster?.blockedUsers ?? []
  const isBlocked = !!(
    otherUserId &&
    blockedUsers.some((u) => u?.id && u.id.toString() === otherUserId)
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
        setSnackbar({
          open: true,
          message: 'User unblocked successfully',
          type: 'success',
        })
      } else {
        await blockBuddy(otherUserId)
        await refetchChatRooms()
        setSnackbar({
          open: true,
          message:
            'User blocked successfully. Chat history is preserved, but they cannot send new messages.',
          type: 'success',
        })
      }
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message ||
        `Failed to ${isBlocked ? 'unblock' : 'block'} user`
      setSnackbar({
        open: true,
        message,
        type: 'danger',
      })
    }
  }

  const handleRemoveBuddy = async () => {
    if (!otherUserId) return

    try {
      await removeBuddy(otherUserId)
      await refetchChatRooms()
      setSnackbar({
        open: true,
        message: 'Buddy removed successfully',
        type: 'success',
      })
    } catch (error: unknown) {
      const message =
        (error as { message?: string })?.message || 'Failed to remove buddy'
      setSnackbar({
        open: true,
        message,
        type: 'danger',
      })
    }
  }

  const handleDeleteChat = () => {
    setSelectedChatRoom(null)
    setSnackbar({
      open: true,
      message: 'Chat closed',
      type: 'info',
    })
  }

  const isUserRoom = messageType === 'USER'

  return (
    <div className="border-b bg-gradient-to-b from-background to-muted px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3">
          <Avatar
            src={typeof avatar === 'string' ? avatar : undefined}
            alt={title || 'Chat avatar'}
            size={44}
          />

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">
              {title || 'Chat'}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
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
              className="ml-auto h-8 w-8 rounded-full text-muted-foreground hover:bg-muted"
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

  const { data: roomsData } = useQuery<{ messageRooms: ChatRoom[] }>(GET_CHAT_ROOMS, {
    fetchPolicy: 'cache-and-network',
  })

  const room: ChatRoom | null =
    roomOverride || roomsData?.messageRooms.find((r) => r._id === selectedRoomId) || null

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
      <div className="flex flex-1 flex-col bg-gradient-to-b from-background via-background to-muted/40">
        <div className="flex-1 overflow-hidden px-2 py-1">
          <MessageItemList room={room} />
        </div>
      </div>
      <div className="border-t bg-background/95 px-4 py-3 shadow-[0_-2px_8px_rgba(15,23,42,0.08)]">
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
