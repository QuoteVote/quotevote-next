'use client'

import { useRef, useCallback, useEffect } from 'react'
// TODO: Fix Apollo Client v4.0.9 type resolution issues
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useMutation export
import { useMutation } from '@apollo/client'
import { UPDATE_TYPING } from '@/graphql/mutations'
import type { UseTypingIndicatorReturn, TypingMutationVariables } from '@/types/hooks'

/**
 * Custom hook to manage typing indicators with debouncing
 * @param messageRoomId - The message room ID
 */
export const useTypingIndicator = (messageRoomId: string): UseTypingIndicatorReturn => {
    const [updateTyping] = useMutation<unknown, TypingMutationVariables>(UPDATE_TYPING)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const isTypingRef = useRef<boolean>(false)

    // Clear typing indicator when component unmounts or room changes
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
            // Send stop typing when unmounting
            if (isTypingRef.current && messageRoomId) {
                updateTyping({
                    variables: {
                        typing: {
                            messageRoomId,
                            isTyping: false,
                        },
                    },
                }).catch(() => {
                    // console.error('Failed to stop typing indicator:', err)
                })
            }
        }
    }, [messageRoomId, updateTyping])

    const stopTyping = useCallback((): void => {
        if (!messageRoomId || !isTypingRef.current) return

        // Clear timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = null
        }

        // Send stop typing
        isTypingRef.current = false
        updateTyping({
            variables: {
                typing: {
                    messageRoomId,
                    isTyping: false,
                },
            },
        }).catch(() => {
            // console.error('Failed to stop typing indicator:', err)
        })
    }, [messageRoomId, updateTyping])

    const handleTyping = useCallback((): void => {
        if (!messageRoomId) return

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // If not already typing, send typing indicator
        if (!isTypingRef.current) {
            isTypingRef.current = true
            updateTyping({
                variables: {
                    typing: {
                        messageRoomId,
                        isTyping: true,
                    },
                },
            }).catch(() => {
                // console.error('Failed to send typing indicator:', err)
                isTypingRef.current = false
            })
        }

        // Set timeout to stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping()
        }, 3000)
    }, [messageRoomId, updateTyping, stopTyping])

    return {
        handleTyping,
        stopTyping,
    }
}

export default useTypingIndicator
