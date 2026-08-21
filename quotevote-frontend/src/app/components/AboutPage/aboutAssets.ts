/** Bump when replacing files in `public/assets/about` so browsers skip stale copies. */
export const ABOUT_ASSET_V = "20260820f";

export function aboutSrc(file: string): string {
  return `/assets/about/${file}?v=${ABOUT_ASSET_V}`;
}
