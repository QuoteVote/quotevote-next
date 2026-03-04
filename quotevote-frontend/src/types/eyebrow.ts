/**
 * Type definitions for eyebrow component
 */

export interface EyebrowFormData {
  email: string;
}

/** Possible statuses returned by checkEmailStatus query */
export type EmailStatus = 'registered' | 'not_requested' | 'requested_pending' | 'approved_no_password';

/** Response shape from checkEmailStatus query */
export interface CheckEmailStatusResult {
  status: EmailStatus;
}

export interface LoginOptionsModalProps {
  email: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export interface OnboardingCompletionModalProps {
  email: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}
