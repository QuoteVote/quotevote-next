export type AuthGateView = 'invite' | 'login';

export interface AuthGateOptions {
  view?: AuthGateView;
}

type AuthGateHandler = (options?: AuthGateOptions) => void;

let authGateHandler: AuthGateHandler | null = null;

export function registerAuthGateHandler(handler: AuthGateHandler | null): void {
  authGateHandler = handler;
}

export function triggerAuthGate(options?: AuthGateOptions): void {
  authGateHandler?.(options);
}
