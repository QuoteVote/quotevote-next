/**
 * Types for the member-facing Solid Pod connection (GraphQL `solid*` API).
 */

export interface SolidConnectionStatus {
  connected: boolean;
  webId: string | null;
  issuer: string | null;
  lastSyncAt: string | null;
}

export interface SolidConnectionStatusData {
  solidConnectionStatus: SolidConnectionStatus;
}

export interface SolidStartConnectData {
  solidStartConnect: { authorizationUrl: string };
}

export interface SolidStartConnectVariables {
  issuer: string;
}

export interface SolidConnectionResult {
  success: boolean;
  webId: string | null;
  issuer: string | null;
  message: string | null;
}

export interface SolidFinishConnectData {
  solidFinishConnect: SolidConnectionResult;
}

export interface SolidFinishConnectVariables {
  code: string;
  state: string;
  redirectUri: string;
}

export interface SolidDisconnectData {
  solidDisconnect: boolean;
}

export interface PortableProfile {
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface PortableNotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface PortableAccessibilityPreferences {
  reduceMotion: boolean;
  fontScale: string;
}

export interface PortablePreferences {
  theme: string;
  notifications: PortableNotificationPreferences;
  accessibility: PortableAccessibilityPreferences;
}

export interface PortableState {
  portableSchemaVersion: string;
  profile: PortableProfile;
  preferences: PortablePreferences;
  updatedAt: string;
}

export interface SolidPullPortableStateData {
  solidPullPortableState: PortableState;
}

export interface PortableStateInput {
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  };
  preferences?: {
    theme?: string;
  };
}

export interface SolidPushPortableStateData {
  solidPushPortableState: boolean;
}

export interface SolidPushPortableStateVariables {
  input: PortableStateInput;
}

/** Backend error extension codes the Solid API can return. */
export type SolidErrorCode =
  | "UNAUTHENTICATED"
  | "BAD_USER_INPUT"
  | "SOLID_REAUTH_REQUIRED"
  | "SOLID_UNAVAILABLE";

export interface SolidPodCardProps {
  /** Current member's display name (from the Settings form / store). */
  displayName: string;
  /** Current member's About text (plain text). */
  bio: string;
  /** Absolute https avatar URL, if the member has one. */
  avatarUrl?: string;
  /** Theme the member currently has selected in Settings. */
  theme: "light" | "dark";
}
