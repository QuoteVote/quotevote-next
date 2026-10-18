import type { PrismaClient } from '@prisma/client';
import { SolidClient } from '../client/solidClient';
import {
    SolidFeatureDisabledError,
    SolidInvalidInputError,
    SolidNotConnectedError,
    SolidPodError,
} from '../errors';
import type {
    PortableState,
    PortableStateInput,
    PortableProfile,
    PortablePreferences,
    ActivityEvent,
    ActivityEventInput,
    ActivityLedger,
} from '../schemas/portable';
import {
    createDefaultProfile,
    createDefaultPreferences,
    PORTABLE_SCHEMA_VERSION,
} from '../schemas/portable';

/**
 * Solid Pod Sync Module
 * Handles reading and writing portable data to/from Solid Pods.
 *
 * Source-of-truth policy (see app/solid/README.md):
 * - pull: Pod values are returned to the caller; nothing is applied to the instance automatically.
 * - push: fields supplied by the member overwrite the same fields in the Pod;
 *   all other Pod fields are preserved.
 * - Civic/governance data is never synced and stays instance-authoritative.
 *
 * Missing Pod resources (HTTP 404) fall back to defaults. Any other Pod failure
 * propagates, so a transient error can never cause a push to overwrite Pod data
 * with defaults.
 */

interface ResourceUris {
    profile: string;
    preferences: string;
    activityLedger?: string;
}

const THEMES: readonly PortablePreferences['theme'][] = ['system', 'light', 'dark'];
const FONT_SCALES: readonly PortablePreferences['accessibility']['fontScale'][] = ['normal', 'large'];

/**
 * Get canonical resource URIs for a user's Pod
 */
async function getResourceUris(userId: string, prisma: PrismaClient): Promise<ResourceUris> {
    const connection = await prisma.solidConnection.findUnique({ where: { userId } });

    if (!connection) {
        throw new SolidNotConnectedError();
    }

    // If URIs are already stored, return them
    const stored = connection.resourceUris;
    if (stored?.profile && stored?.preferences) {
        return {
            profile: stored.profile,
            preferences: stored.preferences,
            activityLedger: stored.activityLedger ?? undefined,
        };
    }

    // Otherwise, construct default URIs based on WebID
    const webIdUrl = new URL(connection.webId);
    const baseUrl = `${webIdUrl.protocol}//${webIdUrl.host}`;

    const uris: ResourceUris = {
        profile: `${baseUrl}/public/quote-vote/profile`,
        preferences: `${baseUrl}/private/quote-vote/preferences`,
        activityLedger: `${baseUrl}/private/quote-vote/activity-ledger`,
    };

    await prisma.solidConnection.update({
        where: { userId },
        data: { resourceUris: uris },
    });

    return uris;
}

/**
 * Read a Pod resource; resolves to undefined only when the resource does not exist (404).
 */
async function readOptional<T>(client: SolidClient, url: string): Promise<T | undefined> {
    try {
        return await client.getJson<T>(url);
    } catch (error) {
        if (error instanceof SolidPodError && error.status === 404) {
            return undefined;
        }
        throw error;
    }
}

/** Drop keys whose value is undefined so they never overwrite existing Pod values. */
function definedOnly<T extends object>(value: T | undefined): Partial<T> {
    if (!value) {
        return {};
    }
    return Object.fromEntries(
        Object.entries(value).filter(([, v]) => v !== undefined)
    ) as Partial<T>;
}

function validatePushInput(input: PortableStateInput): void {
    const theme = input.preferences?.theme;
    if (theme !== undefined && theme !== null && !THEMES.includes(theme)) {
        throw new SolidInvalidInputError('Invalid theme value');
    }
    const fontScale = input.preferences?.accessibility?.fontScale;
    if (fontScale !== undefined && fontScale !== null && !FONT_SCALES.includes(fontScale)) {
        throw new SolidInvalidInputError('Invalid fontScale value');
    }
}

/**
 * Pull portable state from Solid Pod (read-only; nothing is written locally)
 * @param userId - User ID
 * @param clientId - OAuth client ID
 * @param prisma - Prisma client
 * @returns Portable state from Pod
 */
export async function pullPortableState(
    userId: string,
    clientId: string,
    prisma: PrismaClient
): Promise<PortableState> {
    const client = new SolidClient({ userId, clientId, prisma });
    const uris = await getResourceUris(userId, prisma);

    const profile =
        (await readOptional<PortableProfile>(client, uris.profile)) ?? createDefaultProfile();
    const preferences =
        (await readOptional<PortablePreferences>(client, uris.preferences)) ??
        createDefaultPreferences();

    let activityLedger: ActivityLedger | undefined;
    if (uris.activityLedger && process.env.SOLID_ACTIVITY_LEDGER_ENABLED === 'true') {
        activityLedger = await readOptional<ActivityLedger>(client, uris.activityLedger);
    }

    return {
        portableSchemaVersion: PORTABLE_SCHEMA_VERSION,
        profile,
        preferences,
        activityLedger,
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Push portable state to Solid Pod
 * @param userId - User ID
 * @param clientId - OAuth client ID
 * @param input - Partial state to push
 * @param prisma - Prisma client
 * @returns Success status
 */
export async function pushPortableState(
    userId: string,
    clientId: string,
    input: PortableStateInput,
    prisma: PrismaClient
): Promise<boolean> {
    validatePushInput(input);

    const client = new SolidClient({ userId, clientId, prisma });
    const uris = await getResourceUris(userId, prisma);

    if (input.profile) {
        const existing =
            (await readOptional<PortableProfile>(client, uris.profile)) ?? createDefaultProfile();

        const mergedProfile: PortableProfile = {
            ...existing,
            ...definedOnly(input.profile),
        };

        await client.putJson(uris.profile, mergedProfile);
    }

    if (input.preferences) {
        const existing =
            (await readOptional<PortablePreferences>(client, uris.preferences)) ??
            createDefaultPreferences();

        const mergedPreferences: PortablePreferences = {
            ...existing,
            ...definedOnly(input.preferences),
            notifications: {
                ...existing.notifications,
                ...definedOnly(input.preferences.notifications),
            },
            accessibility: {
                ...existing.accessibility,
                ...definedOnly(input.preferences.accessibility),
            },
        };

        await client.putJson(uris.preferences, mergedPreferences);
    }

    await prisma.solidConnection.updateMany({
        where: { userId },
        data: { lastSyncAt: new Date() },
    });

    return true;
}

/**
 * Append activity event to ledger (feature-flagged)
 * @param userId - User ID
 * @param clientId - OAuth client ID
 * @param event - Activity event to append
 * @param prisma - Prisma client
 * @returns Success status
 */
export async function appendActivityEvent(
    userId: string,
    clientId: string,
    event: ActivityEventInput,
    prisma: PrismaClient
): Promise<boolean> {
    if (process.env.SOLID_ACTIVITY_LEDGER_ENABLED !== 'true') {
        throw new SolidFeatureDisabledError();
    }

    const client = new SolidClient({ userId, clientId, prisma });
    const uris = await getResourceUris(userId, prisma);

    if (!uris.activityLedger) {
        throw new Error('Activity ledger URI not configured');
    }

    const ledger =
        (await readOptional<{ events: ActivityEvent[] }>(client, uris.activityLedger)) ??
        { events: [] };

    // Never overwrite a ledger we cannot interpret.
    if (!Array.isArray(ledger.events)) {
        throw new Error('Activity ledger has an unexpected format');
    }

    const newEvent = {
        type: event.type,
        instanceId: event.instanceId,
        resourceUrl: event.resourceUrl,
        timestamp: new Date().toISOString(),
        payload: event.payload,
    } as ActivityEvent;

    ledger.events.push(newEvent);

    await client.putJson(uris.activityLedger, ledger);

    return true;
}
