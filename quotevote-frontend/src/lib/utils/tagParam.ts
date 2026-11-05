/**
 * The home page's tag filter lives in the `tag` URL parameter. Links shared
 * before the Group → Tag change (#539) use `group`, so it is still read.
 */
export const TAG_PARAM = "tag";
export const LEGACY_TAG_PARAM = "group";

/** The tag id to filter by, or an empty string when there is none. */
export function getTagIdParam(params: Pick<URLSearchParams, "get">): string {
  return params.get(TAG_PARAM) || params.get(LEGACY_TAG_PARAM) || "";
}
