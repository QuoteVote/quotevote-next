/**
 * Type definitions for eyebrow component
 */

export interface EyebrowFormData {
  email: string;
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
