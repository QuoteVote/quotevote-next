/**
 * Type definitions for signup components
 */

export interface SignupFormData {
    email: string;
    username: string;
    password: string;
    tos: boolean;
    coc: boolean;
}

export interface SignupError {
    data?: {
        message?: string;
    };
    message?: string;
}

export interface SignupFormProps {
    user: {
        _id: string;
        email: string;
    };
    token: string;
    onSubmit: (data: SignupFormData) => void | Promise<void>;
    loading: boolean;
    signupError?: SignupError | string | null;
}

export interface SignupResponse {
    success: boolean;
    error?: string;
    data?: {
        user?: unknown;
        token?: string;
    };
}
