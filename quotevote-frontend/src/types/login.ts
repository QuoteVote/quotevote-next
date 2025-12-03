/**
 * Type definitions for login components
 */

export interface LoginFormData {
    username: string;
    password: string;
    tos: boolean;
    coc: boolean;
}

export interface LoginError {
    data?: {
        message?: string;
    };
    message?: string;
}

export interface LoginFormProps {
    onSubmit: (data: LoginFormData) => void | Promise<void>;
    loading: boolean;
    loginError?: LoginError | string | null;
}

export interface LoginProps {
    onSubmit?: (data: LoginFormData) => void | Promise<void>;
    loading?: boolean;
}

export interface LoginResponse {
    success: boolean;
    error?: string;
    data?: {
        user?: unknown;
        token?: string;
    };
}
