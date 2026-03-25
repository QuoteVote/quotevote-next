'use client'

import { useMutation } from '@apollo/client/react'
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

interface RosterMutationData {
    addBuddy: RosterMutationResult
    acceptBuddy: RosterMutationResult
    declineBuddy: RosterMutationResult
    blockBuddy: RosterMutationResult
    unblockBuddy: RosterMutationResult
    removeBuddy: RosterMutationResult
}

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
            const data = result.data as RosterMutationData
            addPendingRequest(data.addBuddy)
            return data.addBuddy
        } catch (error: unknown) {
            throw error
        }
    }

    const acceptBuddy = async (rosterId: string): Promise<RosterMutationResult> => {
        try {
            const result = await acceptBuddyMutation({
                variables: { rosterId },
            })
            const data = result.data as RosterMutationData
            removePendingRequest(rosterId)
            return data.acceptBuddy
        } catch (error: unknown) {
            throw error
        }
    }

    const declineBuddy = async (rosterId: string): Promise<RosterMutationResult> => {
        try {
            const result = await declineBuddyMutation({
                variables: { rosterId },
            })
            const data = result.data as RosterMutationData
            removePendingRequest(rosterId)
            return data.declineBuddy
        } catch (error: unknown) {
            throw error
        }
    }

    const blockBuddy = async (buddyId: string): Promise<RosterMutationResult> => {
        try {
            const result = await blockBuddyMutation({
                variables: { buddyId },
            })
            const data = result.data as RosterMutationData
            addBlockedUser(buddyId)
            return data.blockBuddy
        } catch (error: unknown) {
            throw error
        }
    }

    const unblockBuddy = async (buddyId: string): Promise<RosterMutationResult> => {
        try {
            const result = await unblockBuddyMutation({
                variables: { buddyId },
            })
            const data = result.data as RosterMutationData
            removeBlockedUser(buddyId)
            return data.unblockBuddy
        } catch (error: unknown) {
            throw error
        }
    }

    const removeBuddy = async (buddyId: string): Promise<RosterMutationResult> => {
        try {
            const result = await removeBuddyMutation({
                variables: { buddyId },
            })
            const data = result.data as RosterMutationData
            return data.removeBuddy
        } catch (error: unknown) {
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
