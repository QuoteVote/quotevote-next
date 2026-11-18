/**
 * Longest new tag name, mirroring MAX_TAG_TITLE_LENGTH in the backend's tagResolver.
 * createTag rejects anything longer, so bump both together.
 */
export const TAG_TITLE_MAX_LENGTH = 50;
