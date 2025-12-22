/**
 * Application-Wide Type Definitions
 * Defines common types used across the entire application
 */

import { ReactNode } from 'react';

/**
 * Next.js page props with dynamic route parameters
 */
export interface PageProps<T = Record<string, string>> {
  params: T;
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Layout props for Next.js layouts
 */
export interface LayoutProps {
  children: ReactNode;
  params?: Record<string, string>;
}

/**
 * Error page props
 */
export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Loading state type
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

/**
 * Common user data structure
 */
export interface UserData {
  _id: string;
  id?: string;
  name: string;
  username: string;
  email?: string;
  avatar?: {
    url?: string;
    color?: string;
    initials?: string;
  };
  admin?: boolean;
  _followingId?: string[];
  _followersId?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Redux store action type
 */
export interface ReduxAction<T = unknown> {
  type: string;
  payload?: T;
}

/**
 * Snackbar/Toast notification
 */
export interface SnackbarState {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'danger';
  duration?: number;
}

/**
 * Modal/Dialog state
 */
export interface ModalState {
  open: boolean;
  title?: string;
  content?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}

/**
 * File upload type
 */
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * Sort order type
 */
export type SortOrder = 'asc' | 'desc' | 'newest' | 'oldest' | 'popular';

/**
 * Filter options
 */
export interface FilterOptions {
  searchKey?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: SortOrder;
  category?: string;
  tags?: string[];
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  name: string;
  icon?: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

/**
 * Navigation item
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: number;
  children?: NavItem[];
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Generic list response
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Search result
 */
export interface SearchResult<T> {
  results: T[];
  total: number;
  query: string;
  facets?: Record<string, number>;
}

/**
 * Date range
 */
export interface DateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Coordinates for location
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Image data
 */
export interface ImageData {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

/**
 * Video data
 */
export interface VideoData {
  url: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
}

/**
 * Generic async state
 */
export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Language code
 */
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

/**
 * Device type
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Form field error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

/**
 * Generic callback type
 */
export type Callback<T = void> = (data?: T) => void;

/**
 * Generic async callback type
 */
export type AsyncCallback<T = void> = (data?: T) => Promise<void>;
