/**
 * Shared test fixtures for auth E2E specs.
 *
 * Prefer E2E_AUTHOR_* / E2E_REGISTERED_* env vars when a live backend is
 * available. Fallbacks are for mocked GraphQL flows that do not need a
 * real seeded account.
 */

export const registeredUser = {
  email: process.env.E2E_REGISTERED_EMAIL || 'registered.user@quotevote.test',
  username: process.env.E2E_REGISTERED_USERNAME || (process.env.E2E_AUTHOR_USERNAME?.trim() || 'registeredUser'),
  password: process.env.E2E_REGISTERED_PASSWORD || (process.env.E2E_AUTHOR_PASSWORD?.trim() || 'Password123!'),
  name: 'Registered User',
  _id: 'e2e-registered-user-id',
};