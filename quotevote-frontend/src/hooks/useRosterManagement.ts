'use client'

// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useMutation export
import { useMutation } from '@apollo/client'
import { useAppStore } from '@/store'
import {
    ADD_BUDDY,
    ACCEPT_BUDDY,
    DECLINE_BUDDY,
    BLOCK_BUDDY,
    UNBLOCK_BUDDY,
    REMOVE_BUDDY,
} from '@/graphql/mutations'
import { GET_BUDDY_LIST, GET_ROSTER } from '@/graphql/queries'
import type { RosterMutationResult, UseRosterManagementReturn } from '@/types/hooks'

/**
 * Custom hook for roster management (buddy list operations)
 * Migrated from Redux to Zustand for state management
 * @returns Roster mutation functions
 */
export const useRosterManagement = (): UseRosterManagementReturn => {
    const addPendingRequest = useAppStore((state) => state.addPendingRequest)
    const removePendingRequest = useAppStore((state) => state.removePendingRequest)
    const addBlockedUser = useAppStore((state) => state.addBlockedUser)
    const removeBlockedUser = useAppStore((state) => state.removeBlockedUser)

    const [addBuddyMutation] = useMutation(ADD_BUDDY, {
        refetchQueries: [{ query: GET_ROSTER }],
    })

    const [acceptBuddyMutation] = useMutation(ACCEPT_BUDDY, {
        refetchQueries: [{ query: GET_BUDDY_LIST }, { query: GET_ROSTER }],
    })

    const [declineBuddyMutation] = useMutation(DECLINE_BUDDY, {
        refetchQueries: [{ query: GET_ROSTER }],
    })

    const [blockBuddyMutation] = useMutation(BLOCK_BUDDY, {
        refetchQueries: [{ query: GET_ROSTER }],
    })

    const [unblockBuddyMutation] = useMutation(UNBLOCK_BUDDY, {
        refetchQueries: [{ query: GET_ROSTER }],
    })

    const [removeBuddyMutation] = useMutation(REMOVE_BUDDY, {
        refetchQueries: [{ query: GET_BUDDY_LIST }, { query: GET_ROSTER }],
    })

    const addBuddy = async (buddyId: string): Promise<RosterMutationResult> => {
        try {
            const result = await addBuddyMutation({
                variables: { roster: { buddyId } },
            })
            addPendingRequest(result.data.addBuddy)
            return result.data.addBuddy
        } catch (error: unknown) {
            console.error('Add buddy error:', error)
            throw error
        }
    }

    const acceptBuddy = async (rosterId: string): Promise<RosterMutationResult> => {
        try {
            const result = await acceptBuddyMutation({
                variables: { rosterId },
            })
            removePendingRequest(rosterId)
            return result.data.acceptBuddy
        } catch (error: unknown) {
            console.error('Accept buddy error:', error)
            throw error
        }
    }

    const declineBuddy = async (rosterId: string): Promise<RosterMutationResult> => {
        try {
            const result = await declineBuddyMutation({
                variables: { rosterId },
            })
            removePendingRequest(rosterId)
            return result.data.declineBuddy
        } catch (error: unknown) {
            console.error('Decline buddy error:', error)
            throw error
        }
    }

    const blockBuddy = async (buddyId: string): Promise<RosterMutationResult> => {
        try {
            const result = await blockBuddyMutation({
                variables: { buddyId },
            })
            addBlockedUser(buddyId)
            return result.data.blockBuddy
        } catch (error: unknown) {
            console.error('Block buddy error:', error)
            throw error
        }
    }

    const unblockBuddy = async (buddyId: string): Promise<RosterMutationResult> => {
        try {
            const result = await unblockBuddyMutation({
                variables: { buddyId },
            })
            removeBlockedUser(buddyId)
            return result.data.unblockBuddy
        } catch (error: unknown) {
            console.error('Unblock buddy error:', error)
            throw error
        }
    }

    const removeBuddy = async (buddyId: string): Promise<RosterMutationResult> => {
        try {
            const result = await removeBuddyMutation({
                variables: { buddyId },
            })
            return result.data.removeBuddy
        } catch (error: unknown) {
            console.error('Remove buddy error:', error)
            throw error
        }
    }

    return {
        addBuddy,
        acceptBuddy,
        declineBuddy,
        blockBuddy,
        unblockBuddy,
        removeBuddy,
    }
}

export default useRosterManagement
