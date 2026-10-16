"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { BLOCK_USER, UNBLOCK_USER } from "@/graphql/mutations";
import { GET_BUDDY_LIST, GET_USER_BLOCK_STATUS } from "@/graphql/queries";
import type { UserBlockStatusData, UseUserBlockReturn } from "@/types/hooks";

/**
 * Block status between the current user and another user, plus block/unblock actions.
 * The status query is skipped when userId is missing.
 */
export const useUserBlock = (userId?: string | null): UseUserBlockReturn => {
  const { data, loading } = useQuery<UserBlockStatusData>(GET_USER_BLOCK_STATUS, {
    variables: { userId: userId ?? "" },
    skip: !userId,
  });

  const refetchQueries = [
    { query: GET_USER_BLOCK_STATUS, variables: { userId: userId ?? "" } },
    { query: GET_BUDDY_LIST },
  ];

  const [blockMutation] = useMutation(BLOCK_USER, { refetchQueries });
  const [unblockMutation] = useMutation(UNBLOCK_USER, { refetchQueries });

  const block = async (): Promise<void> => {
    if (!userId) return;
    await blockMutation({ variables: { userId } });
  };

  const unblock = async (): Promise<void> => {
    if (!userId) return;
    await unblockMutation({ variables: { userId } });
  };

  return {
    blockedByMe: data?.userBlockStatus?.blockedByMe ?? false,
    blockedMe: data?.userBlockStatus?.blockedMe ?? false,
    block,
    unblock,
    loading,
  };
};

export default useUserBlock;
