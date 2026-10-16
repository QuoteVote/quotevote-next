'use client'

import { useMutation } from '@apollo/client/react'
import { ADD_BUDDY, ACCEPT_BUDDY, DECLINE_BUDDY, REMOVE_BUDDY } from '@/graphql/mutations'
import { GET_BUDDY_LIST, GET_BUDDY_REQUESTS } from '@/graphql/queries'
import type { BuddyRequest } from '@/types/buddylist'
import type { BuddyMutationResult, UseBuddyManagementReturn } from '@/types/hooks'

const refetchQueries = [{ query: GET_BUDDY_LIST }, { query: GET_BUDDY_REQUESTS }]

/**
 * Buddy operations: send, accept, decline and remove.
 * Errors from the backend (blocked, already exists) are rethrown to the caller.
 */
export const useBuddyManagement = (): UseBuddyManagementReturn => {
    const [addBuddyMutation] = useMutation<{ addBuddy: BuddyRequest }>(ADD_BUDDY, { refetchQueries })
    const [acceptBuddyMutation] = useMutation<{ acceptBuddy: BuddyRequest }>(ACCEPT_BUDDY, {
        refetchQueries,
    })
    const [declineBuddyMutation] = useMutation<{ declineBuddy: BuddyMutationResult }>(
        DECLINE_BUDDY,
        { refetchQueries }
    )
    const [removeBuddyMutation] = useMutation<{ removeBuddy: BuddyMutationResult }>(REMOVE_BUDDY, {
        refetchQueries,
    })

    const addBuddy = async (userId: string): Promise<BuddyRequest> => {
        const result = await addBuddyMutation({ variables: { userId } })
        return result.data!.addBuddy
    }

    const acceptBuddy = async (requestId: string): Promise<BuddyRequest> => {
        const result = await acceptBuddyMutation({ variables: { requestId } })
        return result.data!.acceptBuddy
    }

    const declineBuddy = async (requestId: string): Promise<BuddyMutationResult> => {
        const result = await declineBuddyMutation({ variables: { requestId } })
        return result.data!.declineBuddy
    }

    const removeBuddy = async (userId: string): Promise<BuddyMutationResult> => {
        const result = await removeBuddyMutation({ variables: { userId } })
        return result.data!.removeBuddy
    }

    return { addBuddy, acceptBuddy, declineBuddy, removeBuddy }
}

export default useBuddyManagement
