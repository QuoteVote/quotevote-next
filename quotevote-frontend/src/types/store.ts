/**
 * TypeScript interfaces for the global application store
 * These types define the structure of state that will be managed by Zustand
 */

// User state interface
export interface UserState {
  loading: boolean;
  loginError: string | null;
  data: {
    id?: string;
    username?: string;
    email?: string;
    avatar?: string;
    admin?: boolean;
    _followingId?: string;
    [key: string]: unknown;
  };
}

// UI state interface
export interface UIState {
  filter: {
    visibility: boolean;
    value: string | string[];
  };
  date: {
    visibility: boolean;
    value: string;
  };
  search: {
    visibility: boolean;
    value: string;
  };
  selectedPost: {
    id: string | null;
  };
  selectedPage: string;
  hiddenPosts: string[];
  snackbar: {
    open: boolean;
    type: string;
    message: string;
  };
  selectedPlan: string;
  focusedComment: string | null;
  sharedComment: string | null;
}

// Chat state interface
export interface ChatState {
  submitting: boolean;
  selectedRoom: string | null;
  open: boolean;
  buddyList: unknown[];
  presenceMap: Record<string, {
    status: string;
    statusMessage: string;
    lastSeen: number;
  }>;
  typingUsers: Record<string, string[]>;
  userStatus: string;
  userStatusMessage: string;
  pendingBuddyRequests: unknown[];
  blockedUsers: string[];
  statusEditorOpen: boolean;
}

// Filter state interface
export interface FilterState {
  filter: {
    visibility: boolean;
    value: string[];
  };
  date: {
    visibility: boolean;
    value: string;
  };
  search: {
    visibility: boolean;
    value: string;
  };
}

// Root application state interface
export interface AppState {
  user: UserState;
  ui: UIState;
  chat: ChatState;
  filter: FilterState;
}
