/**
 * Type definitions for eyebrow component
 */

export interface EyebrowFormData {
    email: string;
}

export interface LoginOptionsModalProps {
    isOpen: boolean,
    onClose: () => void
}

export interface OnboardingCompletionModal {
    isOpen: boolean,
    onClose: () => void
}