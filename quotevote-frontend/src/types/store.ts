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

// Activity types
export interface Activity {
  event: string;
  data: {
    _id?: string;
    created?: string | number | Date;
    type?: string;
    points?: number | string;
    content?: {
      title?: string;
      [key: string]: unknown;
    };
    title?: string;
    quote?: string;
    creator?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Theme types
export interface ThemeShape {
  activityCards: {
    quoted: { color: string };
    commented: { color: string };
    [key: string]: { color: string };
  };
  [key: string]: unknown;
}

// Auth types
export interface DecodedToken {
  exp?: number;
  [key: string]: unknown;
}

// Activity content types
export interface GetActivityContentArgs {
  type: string;
  post: { text: string; [key: string]: unknown };
  quote?: { startWordIndex: number; endWordIndex: number; [key: string]: unknown };
  vote?: { startWordIndex: number; endWordIndex: number; type?: string; [key: string]: unknown };
  comment?: { startWordIndex: number; endWordIndex: number; [key: string]: unknown };
}

export type ActivityContentType = string;

// Vote types
export interface Vote {
  startWordIndex: number;
  endWordIndex: number;
  type?: string;
  up?: number;
  down?: number;
  [key: string]: unknown;
}

import type { CSSProperties } from 'react';

export type VoteStyle = CSSProperties | null;

export interface VotePoint {
  up?: number;
  down?: number;
  total?: number;
  range?: string;
  start?: number;
  end?: number;
  [key: string]: unknown;
}

export interface Span {
  startIndex: number;
  endIndex: number;
  text?: string;
  spanBg?: CSSProperties | null;
  value?: {
    up?: number;
    down?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ReduceAccumulator {
  prevVal?: VotePoint | Record<string, unknown>;
  prevKey?: number | string;
  [key: string]: unknown;
}

// Object ID types
export type IdLike = string | { toString: () => string } | unknown;

export interface MongoObjectID {
  toString: () => string;
  [key: string]: unknown;
}

export interface PostWithIds {
  _id?: IdLike;
  [key: string]: unknown;
}

export interface VotedByEntry {
  [key: string]: unknown;
}

export interface CreatorRef {
  [key: string]: unknown;
}

// Parser types
export interface ParsedSelection {
  [key: string]: unknown;
}

// Pagination types
export interface PageToOffsetResult {
  limit: number;
  offset: number;
}

export interface OffsetToPageResult {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  currentPage?: number;
  pageSize: number;
  totalPages: number;
  hasNextPage?: boolean;
  [key: string]: unknown;
}

export interface NormalizePaginationParamsInput {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface NormalizePaginationParamsOutput {
  page: number;
  pageSize: number;
  totalCount?: number;
}

export interface GraphQLVariableParams {
  [key: string]: unknown;
}

export interface GraphQLVariables {
  [key: string]: unknown;
}

export interface ExtractPaginationDataResult<T = unknown> {
  data?: T[];
  pagination?: PaginationMeta;
  [key: string]: unknown;
}

// SEO types
export interface SeoParams {
  page?: number;
  pageSize?: number;
  searchKey?: string;
  sortOrder?: string;
  friendsOnly?: boolean;
  interactions?: boolean;
  [key: string]: unknown;
}

export interface PaginationUrlsResult {
  prevUrl?: string | null;
  nextUrl?: string | null;
  [key: string]: string | null | undefined;
}

export interface LocationLike {
  pathname?: string;
  search?: string;
  [key: string]: unknown;
}

export interface PaginationStructuredData {
  mainEntity?: {
    itemListElement?: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
