/**
 * Main Zustand store for global application state
 * 
 * This store replaces the Redux store and provides a simpler,
 * more React-friendly state management solution for Next.js App Router.
 */

import { create } from 'zustand';
import type { AppState, UserState, UIState, ChatState, FilterState } from '@/types/store';

// Initial state values
const initialUserState: UserState = {
  loading: false,
  loginError: null,
  data: {},
};

const initialUIState: UIState = {
  filter: {
    visibility: false,
    value: '',
  },
  date: {
    visibility: false,
    value: '',
  },
  search: {
    visibility: false,
    value: '',
  },
  selectedPost: {
    id: null,
  },
  selectedPage: 'home',
  hiddenPosts: [],
  snackbar: {
    open: false,
    type: '',
    message: '',
  },
  selectedPlan: 'personal',
  focusedComment: null,
  sharedComment: null,
};

const initialChatState: ChatState = {
  submitting: false,
  selectedRoom: null,
  open: false,
  buddyList: [],
  presenceMap: {},
  typingUsers: {},
  userStatus: 'online',
  userStatusMessage: '',
  pendingBuddyRequests: [],
  blockedUsers: [],
  statusEditorOpen: false,
};

const initialFilterState: FilterState = {
  filter: {
    visibility: false,
    value: ['POSTED'],
  },
  date: {
    visibility: false,
    value: '',
  },
  search: {
    visibility: false,
    value: '',
  },
};

// Store interface with actions
interface AppStore extends AppState {
  // User actions
  setUserData: (data: UserState['data']) => void;
  setUserLoading: (loading: boolean) => void;
  setLoginError: (error: string | null) => void;
  logout: () => void;
  updateAvatar: (avatar: string) => void;
  updateFollowing: (followingId: string) => void;

  // UI actions
  setSelectedPost: (postId: string | null) => void;
  setSelectedPage: (page: string) => void;
  addHiddenPost: (postId: string) => void;
  setSnackbar: (snackbar: UIState['snackbar']) => void;
  setSelectedPlan: (plan: string) => void;
  setFocusedComment: (commentId: string | null) => void;
  setSharedComment: (commentId: string | null) => void;

  // Chat actions
  setChatSubmitting: (submitting: boolean) => void;
  setSelectedChatRoom: (roomId: string | null) => void;
  setChatOpen: (open: boolean) => void;
  setBuddyList: (buddyList: unknown[]) => void;
  updatePresence: (userId: string, presence: ChatState['presenceMap'][string]) => void;
  removePresence: (userId: string) => void;
  updateTyping: (messageRoomId: string, userId: string, isTyping: boolean) => void;
  clearTyping: (messageRoomId: string) => void;
  setUserStatus: (status: string, statusMessage?: string) => void;
  addPendingRequest: (request: unknown) => void;
  removePendingRequest: (rosterId: string) => void;
  addBlockedUser: (userId: string) => void;
  removeBlockedUser: (userId: string) => void;

  // Filter actions
  setFilterVisibility: (visibility: boolean) => void;
  setFilterValue: (value: string[]) => void;
  setDateVisibility: (visibility: boolean) => void;
  setDateValue: (value: string) => void;
  setSearchVisibility: (visibility: boolean) => void;
  setSearchValue: (value: string) => void;

  // Reset actions
  resetStore: () => void;
}

// Create the Zustand store
export const useAppStore = create<AppStore>((set) => ({
  // Initial state
  user: initialUserState,
  ui: initialUIState,
  chat: initialChatState,
  filter: initialFilterState,

  // User actions
  setUserData: (data) =>
    set((state) => ({
      user: { ...state.user, data },
    })),

  setUserLoading: (loading) =>
    set((state) => ({
      user: { ...state.user, loading },
    })),

  setLoginError: (error) =>
    set((state) => ({
      user: { ...state.user, loginError: error },
    })),

  logout: () =>
    set(() => ({
      user: {
        ...initialUserState,
        loading: false,
      },
    })),

  updateAvatar: (avatar) =>
    set((state) => ({
      user: {
        ...state.user,
        data: { ...state.user.data, avatar },
      },
    })),

  updateFollowing: (followingId) =>
    set((state) => ({
      user: {
        ...state.user,
        data: { ...state.user.data, _followingId: followingId },
      },
    })),

  // UI actions
  setSelectedPost: (postId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedPost: { id: postId },
      },
    })),

  setSelectedPage: (page) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedPage: page,
      },
    })),

  addHiddenPost: (postId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        hiddenPosts: [...state.ui.hiddenPosts, postId],
      },
    })),

  setSnackbar: (snackbar) =>
    set((state) => ({
      ui: {
        ...state.ui,
        snackbar,
      },
    })),

  setSelectedPlan: (plan) =>
    set((state) => ({
      ui: {
        ...state.ui,
        selectedPlan: plan,
      },
    })),

  setFocusedComment: (commentId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        focusedComment: commentId,
      },
    })),

  setSharedComment: (commentId) =>
    set((state) => ({
      ui: {
        ...state.ui,
        sharedComment: commentId,
      },
    })),

  // Chat actions
  setChatSubmitting: (submitting) =>
    set((state) => ({
      chat: {
        ...state.chat,
        submitting,
      },
    })),

  setSelectedChatRoom: (roomId) =>
    set((state) => ({
      chat: {
        ...state.chat,
        selectedRoom: roomId,
      },
    })),

  setChatOpen: (open) =>
    set((state) => ({
      chat: {
        ...state.chat,
        open,
      },
    })),

  setBuddyList: (buddyList) =>
    set((state) => ({
      chat: {
        ...state.chat,
        buddyList,
      },
    })),

  updatePresence: (userId, presence) =>
    set((state) => ({
      chat: {
        ...state.chat,
        presenceMap: {
          ...state.chat.presenceMap,
          [userId]: presence,
        },
      },
    })),

  removePresence: (userId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [userId]: _, ...rest } = state.chat.presenceMap;
      return {
        chat: {
          ...state.chat,
          presenceMap: rest,
        },
      };
    }),

  updateTyping: (messageRoomId, userId, isTyping) =>
    set((state) => {
      const currentTyping = state.chat.typingUsers[messageRoomId] || [];
      const updatedTyping = isTyping
        ? currentTyping.includes(userId)
          ? currentTyping
          : [...currentTyping, userId]
        : currentTyping.filter((id) => id !== userId);

      return {
        chat: {
          ...state.chat,
          typingUsers: {
            ...state.chat.typingUsers,
            [messageRoomId]: updatedTyping,
          },
        },
      };
    }),

  clearTyping: (messageRoomId) =>
    set((state) => ({
      chat: {
        ...state.chat,
        typingUsers: {
          ...state.chat.typingUsers,
          [messageRoomId]: [],
        },
      },
    })),

  setUserStatus: (status, statusMessage = '') =>
    set((state) => ({
      chat: {
        ...state.chat,
        userStatus: status,
        userStatusMessage: statusMessage,
      },
    })),

  addPendingRequest: (request) =>
    set((state) => ({
      chat: {
        ...state.chat,
        pendingBuddyRequests: [...state.chat.pendingBuddyRequests, request],
      },
    })),

  removePendingRequest: (rosterId) =>
    set((state) => ({
      chat: {
        ...state.chat,
        pendingBuddyRequests: state.chat.pendingBuddyRequests.filter(
          (req) => (req as { id: string }).id !== rosterId
        ),
      },
    })),

  addBlockedUser: (userId) =>
    set((state) => ({
      chat: {
        ...state.chat,
        blockedUsers: [...state.chat.blockedUsers, userId],
      },
    })),

  removeBlockedUser: (userId) =>
    set((state) => ({
      chat: {
        ...state.chat,
        blockedUsers: state.chat.blockedUsers.filter((id) => id !== userId),
      },
    })),

  // Filter actions
  setFilterVisibility: (visibility) =>
    set((state) => ({
      filter: {
        ...state.filter,
        filter: {
          ...state.filter.filter,
          visibility,
        },
      },
    })),

  setFilterValue: (value) =>
    set((state) => ({
      filter: {
        ...state.filter,
        filter: {
          ...state.filter.filter,
          value,
        },
      },
    })),

  setDateVisibility: (visibility) =>
    set((state) => ({
      filter: {
        ...state.filter,
        date: {
          ...state.filter.date,
          visibility,
        },
      },
    })),

  setDateValue: (value) =>
    set((state) => ({
      filter: {
        ...state.filter,
        date: {
          ...state.filter.date,
          value,
        },
      },
    })),

  setSearchVisibility: (visibility) =>
    set((state) => ({
      filter: {
        ...state.filter,
        search: {
          ...state.filter.search,
          visibility,
        },
      },
    })),

  setSearchValue: (value) =>
    set((state) => ({
      filter: {
        ...state.filter,
        search: {
          ...state.filter.search,
          value,
        },
      },
    })),

  // Reset action
  resetStore: () =>
    set({
      user: initialUserState,
      ui: initialUIState,
      chat: initialChatState,
      filter: initialFilterState,
    }),
}));

