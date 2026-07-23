/**
 * Shared validation for user About / bio text.
 * Plain text only; max length matches frontend PROFILE_BIO_MAX_LENGTH.
 */

export const BIO_MAX_LENGTH = 500;

/** Detects HTML / markup that should not be stored as plain-text bio. */
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

/**
 * Normalize and validate bio input for updateUser.
 * Returns trimmed plain text, or empty string when cleared.
 * Throws Error with a user-facing message on invalid input.
 */
export function normalizeBio(raw: string | null | undefined): string {
  if (raw == null) {
    return '';
  }

  const trimmed = raw.trim();

  if (trimmed.length > BIO_MAX_LENGTH) {
    throw new Error(`About must be ${BIO_MAX_LENGTH} characters or fewer`);
  }

  if (HTML_TAG_PATTERN.test(trimmed)) {
    throw new Error('About must be plain text without HTML');
  }

  return trimmed;
}
