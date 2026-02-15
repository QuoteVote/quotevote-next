import { SolidClient } from '../client/solidClient';
import { SolidConnection } from '../../data/models/SolidConnection';
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
 * Handles reading and writing portable data to/from Solid Pods
 */

/**
 * Get canonical resource URIs for a user's Pod
 */
async function getResourceUris(userId: string): Promise<{
    profile: string;
    preferences: string;
    activityLedger?: string;
}> {
    const connection = await SolidConnection.findOne({ userId });

    if (!connection) {
        throw new Error('No Solid connection found for user');
    }

    // If URIs are already stored, return them
    if (connection.resourceUris?.profile && connection.resourceUris?.preferences) {
        return connection.resourceUris as {
            profile: string;
            preferences: string;
            activityLedger?: string;
        };
    }

    // Otherwise, construct default URIs based on WebID
    const webIdUrl = new URL(connection.webId);
    const baseUrl = `${webIdUrl.protocol}//${webIdUrl.host}`;

    const uris = {
        profile: `${baseUrl}/public/quote-vote/profile`,
        preferences: `${baseUrl}/private/quote-vote/preferences`,
        activityLedger: `${baseUrl}/private/quote-vote/activity-ledger`,
    };

    // Store URIs for future use
    connection.resourceUris = uris;
    await connection.save();

    return uris;
}

/**
 * Pull portable state from Solid Pod
 * @param userId - User ID
 * @param clientId - OAuth client ID
 * @returns Portable state from Pod
 */
export async function pullPortableState(
    userId: string,
    clientId: string
): Promise<PortableState> {
    const client = new SolidClient({ userId, clientId });
    const uris = await getResourceUris(userId);

    try {
        // Fetch profile
        let profile: PortableProfile;
        try {
            profile = await client.getJson<PortableProfile>(uris.profile);
        } catch {
            // If profile doesn't exist, use default
            profile = createDefaultProfile();
        }

        // Fetch preferences
        let preferences: PortablePreferences;
        try {
            preferences = await client.getJson<PortablePreferences>(uris.preferences);
        } catch {
            // If preferences don't exist, use default
            preferences = createDefaultPreferences();
        }

        // Fetch activity ledger if enabled
        let activityLedger: ActivityLedger | undefined;
        if (uris.activityLedger && process.env.SOLID_ACTIVITY_LEDGER_ENABLED === 'true') {
            try {
                activityLedger = await client.getJson<ActivityLedger>(uris.activityLedger);
            } catch {
                // Activity ledger is optional
                activityLedger = undefined;
            }
        }

        return {
            portableSchemaVersion: PORTABLE_SCHEMA_VERSION,
            profile,
            preferences,
            activityLedger,
            updatedAt: new Date().toISOString(),
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to pull portable state: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Push portable state to Solid Pod
 * @param userId - User ID
 * @param clientId - OAuth client ID
 * @param input - Partial state to push
 * @returns Success status
 */
export async function pushPortableState(
    userId: string,
    clientId: string,
    input: PortableStateInput
): Promise<boolean> {
    const client = new SolidClient({ userId, clientId });
    const uris = await getResourceUris(userId);

    try {
        // Push profile if provided
        if (input.profile) {
            // Fetch existing profile to merge
            let existingProfile: PortableProfile;
            try {
                existingProfile = await client.getJson<PortableProfile>(uris.profile);
            } catch {
                existingProfile = createDefaultProfile();
            }

            const mergedProfile: PortableProfile = {
                ...existingProfile,
                ...input.profile,
            };

            await client.putJson(uris.profile, mergedProfile);
        }

        // Push preferences if provided
        if (input.preferences) {
            // Fetch existing preferences to merge
            let existingPreferences: PortablePreferences;
            try {
                existingPreferences = await client.getJson<PortablePreferences>(uris.preferences);
            } catch {
                existingPreferences = createDefaultPreferences();
            }

            const mergedPreferences: PortablePreferences = {
                ...existingPreferences,
                ...input.preferences,
                notifications: {
                    ...existingPreferences.notifications,
                    ...(input.preferences.notifications || {}),
                },
                accessibility: {
                    ...existingPreferences.accessibility,
                    ...(input.preferences.accessibility || {}),
                },
            };

            await client.putJson(uris.preferences, mergedPreferences);
        }

        // Update lastSyncAt
        await SolidConnection.findOneAndUpdate(
            { userId },
            { lastSyncAt: new Date() }
        );

        return true;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to push portable state: ${error.message}`);
        }
        throw error;
    }
}

/**
 * Append activity event to ledger (feature-flagged)
 * @param userId - User ID
 * @param clientId - OAuth client ID
 * @param event - Activity event to append
 * @returns Success status
 */
export async function appendActivityEvent(
    userId: string,
    clientId: string,
    event: ActivityEventInput
): Promise<boolean> {
    // Check if activity ledger is enabled
    if (process.env.SOLID_ACTIVITY_LEDGER_ENABLED !== 'true') {
        throw new Error('Activity ledger is not enabled');
    }

    const client = new SolidClient({ userId, clientId });
    const uris = await getResourceUris(userId);

    if (!uris.activityLedger) {
        throw new Error('Activity ledger URI not configured');
    }

    try {
        // Fetch existing ledger
        let ledger: { events: ActivityEvent[] };
        try {
            ledger = await client.getJson<{ events: ActivityEvent[] }>(uris.activityLedger);
        } catch {
            ledger = { events: [] };
        }

        // Create new event
        const newEvent: ActivityEvent = {
            type: event.type,
            instanceId: event.instanceId,
            resourceUrl: event.resourceUrl,
            timestamp: new Date().toISOString(),
            payload: event.payload,
        } as ActivityEvent;

        // Append event
        ledger.events.push(newEvent);

        // Write back to Pod
        await client.putJson(uris.activityLedger, ledger);

        return true;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to append activity event: ${error.message}`);
        }
        throw error;
    }
}
