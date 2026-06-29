/**
 * Shared test fixtures for auth E2E specs.
 *
 * NOTE: The backend does not yet implement a real `/auth/check-email`
 * endpoint (see quotevote-frontend/src/app/components/Eyebrow/Eyebrow.tsx,
 * which calls it but has no corresponding server route). Until that route
 * exists, these specs mock the network response for `/auth/check-email`
 * rather than depending on a real seeded database record. Once the backend
 * implements the endpoint, `registeredUser.email` should be updated to point
 * at an actual seeded account and the mocked route in auth.spec.ts can be
 * removed.
 */

export const registeredUser = {
  email: "registered.user@quotevote.test",
};