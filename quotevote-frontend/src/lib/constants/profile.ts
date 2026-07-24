/** Max length for profile About / bio (plain text). */
export const PROFILE_BIO_MAX_LENGTH = 500

/** Detects HTML / markup — About must remain plain text. */
export const PROFILE_BIO_HTML_PATTERN = /<\/?[a-z][\s\S]*>/i
