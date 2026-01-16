/**
 * Portable Data Schemas for Solid Pod Integration
 * Defines the structure of data synced between Quote.Vote and Solid Pods
 */

/**
 * Schema version for portable data
 */
export const PORTABLE_SCHEMA_VERSION = '0';

/**
 * Profile data stored in Solid Pod
 */
export interface PortableProfile {
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    inApp: boolean;
}

/**
 * Accessibility preferences
 */
export interface AccessibilityPreferences {
    reduceMotion: boolean;
    fontScale: 'normal' | 'large';
}

/**
 * User preferences stored in Solid Pod
 */
export interface PortablePreferences {
    theme: 'system' | 'light' | 'dark';
    notifications: NotificationPreferences;
    accessibility: AccessibilityPreferences;
}

/**
 * Activity event types
 */
export type ActivityEventType =
    | 'PostCreated'
    | 'QuoteCreated'
    | 'VoteCast'
    | 'BookmarkAdded';

/**
 * Base activity event
 */
export interface BaseActivityEvent {
    type: ActivityEventType;
    instanceId: string;
    resourceUrl: string;
    timestamp: string; // ISO8601
}

/**
 * Post created event
 */
export interface PostCreatedEvent extends BaseActivityEvent {
    type: 'PostCreated';
    payload: {
        postId: string;
        content: string;
    };
}

/**
 * Quote created event
 */
export interface QuoteCreatedEvent extends BaseActivityEvent {
    type: 'QuoteCreated';
    payload: {
        quoteId: string;
        quotedPostId: string;
        content: string;
    };
}

/**
 * Vote cast event
 */
export interface VoteCastEvent extends BaseActivityEvent {
    type: 'VoteCast';
    payload: {
        voteId: string;
        targetId: string;
        voteType: 'up' | 'down';
    };
}

/**
 * Bookmark added event
 */
export interface BookmarkAddedEvent extends BaseActivityEvent {
    type: 'BookmarkAdded';
    payload: {
        bookmarkId: string;
        targetId: string;
    };
}

/**
 * Union type for all activity events
 */
export type ActivityEvent =
    | PostCreatedEvent
    | QuoteCreatedEvent
    | VoteCastEvent
    | BookmarkAddedEvent;

/**
 * Activity ledger stored in Solid Pod
 */
export interface ActivityLedger {
    events: ActivityEvent[];
}

/**
 * Complete portable state
 */
export interface PortableState {
    portableSchemaVersion: string;
    profile: PortableProfile;
    preferences: PortablePreferences;
    activityLedger?: ActivityLedger;
    updatedAt: string; // ISO8601
}

/**
 * Input for pushing portable state
 */
export interface PortableStateInput {
    profile?: Partial<PortableProfile>;
    preferences?: Partial<PortablePreferences>;
}

/**
 * Input for appending activity event
 */
export interface ActivityEventInput {
    type: ActivityEventType;
    instanceId: string;
    resourceUrl: string;
    payload: Record<string, unknown>;
}

/**
 * Validate profile data
 */
export function validateProfile(profile: unknown): profile is PortableProfile {
    if (!profile || typeof profile !== 'object') {
        return false;
    }

    const p = profile as Record<string, unknown>;

    return (
        typeof p.displayName === 'string' &&
        (p.avatarUrl === null || typeof p.avatarUrl === 'string') &&
        (p.bio === null || typeof p.bio === 'string')
    );
}

/**
 * Validate preferences data
 */
export function validatePreferences(preferences: unknown): preferences is PortablePreferences {
    if (!preferences || typeof preferences !== 'object') {
        return false;
    }

    const p = preferences as Record<string, unknown>;

    return (
        (p.theme === 'system' || p.theme === 'light' || p.theme === 'dark') &&
        typeof p.notifications === 'object' &&
        p.notifications !== null &&
        typeof p.accessibility === 'object' &&
        p.accessibility !== null
    );
}

/**
 * Create default portable profile
 */
export function createDefaultProfile(): PortableProfile {
    return {
        displayName: '',
        avatarUrl: null,
        bio: null,
    };
}

/**
 * Create default portable preferences
 */
export function createDefaultPreferences(): PortablePreferences {
    return {
        theme: 'system',
        notifications: {
            email: true,
            push: true,
            inApp: true,
        },
        accessibility: {
            reduceMotion: false,
            fontScale: 'normal',
        },
    };
}

/**
 * Create default portable state
 */
export function createDefaultPortableState(): PortableState {
    return {
        portableSchemaVersion: PORTABLE_SCHEMA_VERSION,
        profile: createDefaultProfile(),
        preferences: createDefaultPreferences(),
        updatedAt: new Date().toISOString(),
    };
}
