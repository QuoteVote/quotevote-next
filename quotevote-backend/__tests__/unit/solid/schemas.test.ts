import {
    validateProfile,
    validatePreferences,
    createDefaultProfile,
    createDefaultPreferences,
    createDefaultPortableState,
    PORTABLE_SCHEMA_VERSION,
} from '../../../app/solid/schemas/portable';

describe('Solid Schemas - Portable Data', () => {
    describe('validateProfile', () => {
        it('should validate correct profile', () => {
            const profile = {
                displayName: 'John Doe',
                avatarUrl: 'https://example.com/avatar.jpg',
                bio: 'Software developer',
            };

            expect(validateProfile(profile)).toBe(true);
        });

        it('should validate profile with null values', () => {
            const profile = {
                displayName: 'John Doe',
                avatarUrl: null,
                bio: null,
            };

            expect(validateProfile(profile)).toBe(true);
        });

        it('should reject invalid profile', () => {
            expect(validateProfile(null)).toBe(false);
            expect(validateProfile(undefined)).toBe(false);
            expect(validateProfile({})).toBe(false);
            expect(validateProfile({ displayName: 123 })).toBe(false);
            expect(validateProfile({ displayName: 'John', avatarUrl: 123 })).toBe(false);
        });
    });

    describe('validatePreferences', () => {
        it('should validate correct preferences', () => {
            const preferences = {
                theme: 'dark',
                notifications: {
                    email: true,
                    push: false,
                    inApp: true,
                },
                accessibility: {
                    reduceMotion: false,
                    fontScale: 'normal',
                },
            };

            expect(validatePreferences(preferences)).toBe(true);
        });

        it('should reject invalid preferences', () => {
            expect(validatePreferences(null)).toBe(false);
            expect(validatePreferences(undefined)).toBe(false);
            expect(validatePreferences({})).toBe(false);
            expect(validatePreferences({ theme: 'invalid' })).toBe(false);
            expect(validatePreferences({ theme: 'dark', notifications: null })).toBe(false);
        });
    });

    describe('createDefaultProfile', () => {
        it('should create default profile', () => {
            const profile = createDefaultProfile();

            expect(profile).toEqual({
                displayName: '',
                avatarUrl: null,
                bio: null,
            });
        });
    });

    describe('createDefaultPreferences', () => {
        it('should create default preferences', () => {
            const preferences = createDefaultPreferences();

            expect(preferences).toEqual({
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
            });
        });
    });

    describe('createDefaultPortableState', () => {
        it('should create default portable state', () => {
            const state = createDefaultPortableState();

            expect(state.portableSchemaVersion).toBe(PORTABLE_SCHEMA_VERSION);
            expect(state.profile).toEqual(createDefaultProfile());
            expect(state.preferences).toEqual(createDefaultPreferences());
            expect(state.updatedAt).toBeTruthy();
            expect(new Date(state.updatedAt).getTime()).toBeGreaterThan(0);
        });
    });
});
