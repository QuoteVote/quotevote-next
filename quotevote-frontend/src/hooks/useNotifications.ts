'use client';

import { toast } from 'sonner';
import type { NotificationHandler } from '@/types/notification';

/**
 * Custom hook for displaying toast notifications using sonner
 * 
 * Provides a simple API for showing success, error, info, and warning toasts
 * 
 * @example
 * ```tsx
 * const { notifySuccess, notifyError } = useNotifications();
 * 
 * notifySuccess('Post created successfully!');
 * notifyError('Failed to create post');
 * ```
 */
export function useNotifications(): NotificationHandler {
  const notifySuccess = (message: string, options?: { duration?: number }): void => {
    toast.success(message, {
      duration: options?.duration ?? 4000,
    });
  };

  const notifyError = (message: string, options?: { duration?: number }): void => {
    toast.error(message, {
      duration: options?.duration ?? 5000,
    });
  };

  const notifyInfo = (message: string, options?: { duration?: number }): void => {
    toast.info(message, {
      duration: options?.duration ?? 4000,
    });
  };

  const notifyWarning = (message: string, options?: { duration?: number }): void => {
    toast.warning(message, {
      duration: options?.duration ?? 4000,
    });
  };

  return {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
  };
}

