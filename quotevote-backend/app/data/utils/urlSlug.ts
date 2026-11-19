/**
 * Turns a title into one URL path segment: lowercase letters and digits joined by `-`.
 * Legacy only replaced spaces, so a `?`, `#` or `/` in a title ended up in the link and
 * cut it short (`/post/tag/is-this-ok?/<id>` drops the post id). Letters outside ASCII
 * are kept, so titles in other languages still get a readable slug.
 */
export function slugify(title: string, fallback: string): string {
  const slug = title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
}
