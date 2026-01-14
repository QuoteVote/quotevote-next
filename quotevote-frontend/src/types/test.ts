/**
 * Test-related TypeScript types
 * Used for test pages and mock data structures
 */

import type { SettingsUserData } from './settings';

/**
 * User interface for test pages
 */
export interface TestUser {
    id?: string;
    username?: string;
    email?: string;
    [key: string]: unknown;
}

/**
 * Settings update response interface
 */
export interface UpdateUserResponse {
  updateUser: SettingsUserData;
}
