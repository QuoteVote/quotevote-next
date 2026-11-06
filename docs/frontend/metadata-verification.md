# Next.js Metadata Verification (Issues #92 and #93)

Route-level metadata after the `react-helmet-async` → Next.js Metadata API migration. #93 added the metadata; this document records the #92 verification of the result.

- **Base commit:** `f9480df` (main)
- **Method:** source inventory of every `page.tsx` / `layout.tsx` under `quotevote-frontend/src/app`; `pnpm build`; `pnpm start` with `NEXT_PUBLIC_SITE_URL=http://localhost:3100` and the API at `https://api.quote.vote`; server-rendered `<head>` inspected with `curl` using a social-crawler user agent (`Twitterbot/1.0`).

## Summary

| Acceptance criterion | Before | After |
| --- | --- | --- |
| No active `react-helmet-async` usage | ✅ | ✅ Not in `package.json` or lockfile; no imports |
| Root metadata renders through the Metadata API | ✅ | ✅ `src/app/layout.tsx` also sets `metadataBase` |
| Public routes have intentional titles and descriptions | ⚠️ 8 inherited the root description | ✅ Every page has its own title and description (except `terms` and `signup`, see below) |
| Dynamic content has entity-specific metadata | ⚠️ Profile title only; post none | ✅ Post title and excerpt; profile name and handle |
| Canonical, Open Graph and Twitter tags are valid | ❌ Sub-pages inherited the home page's `og:title`/`og:url`; no canonical; no image | ✅ Per-page canonical, `og:*` and `twitter:*` tags, plus a 1200×630 image |
| Production build without metadata errors | ✅ | ✅ |

## What changed

- **Shared helper** `src/lib/seo/metadata.ts`: `buildPageMetadata()` sets title, description, `alternates.canonical`, `openGraph` (url, siteName, type, image) and `twitter` together, so a page can no longer override one and inherit stale values for the rest. `noIndex` adds `robots: noindex, nofollow`.
- **Site URL:** `metadataBase` comes from `NEXT_PUBLIC_SITE_URL`, falling back to `VERCEL_PROJECT_PRODUCTION_URL` and then `http://localhost:3000`. The hardcoded `https://quote.vote` is removed, since that domain still serves the legacy client.
- **Post detail:** the client component moved to `PostPageContent.tsx`. The new server `page.tsx` has `generateMetadata()`, which loads the post's title, text, URL, created date and author through `src/lib/seo/serverData.ts`.
- **Profile:** `generateMetadata()` loads the public `user(username)` record and uses the display name and handle.
- **Server data** (`src/lib/seo/serverData.ts`): plain `fetch` against the public GraphQL API, cached with React `cache()` and revalidated every 5 minutes. Requests time out after 3 s (10 s for the sitemap). The loaders tell "not found" apart from "couldn't ask": a missing or deleted post (including a legacy HTTP 404) or an unknown username returns `null`, and the page is marked `noindex`. A timeout, network error or server error returns `undefined`, and the page keeps an indexable generic fallback, so a slow or down API never breaks or de-indexes a page.
- **Social image:** `src/app/opengraph-image.tsx` generates a 1200×630 PNG, used for both `og:image` and `twitter:image`.
- **robots.txt and sitemap.xml:** `public/robots.txt` and `public/sitemap.xml` are replaced by `src/app/robots.ts` and `src/app/sitemap.ts`, both built from the site URL. The sitemap lists static pages, public posts and the profiles of their authors.
- **Indexing:** signed-in, token and utility pages are `noindex`.

## Route inventory (after)

| Route | Source | Indexed | Notes |
| --- | --- | --- | --- |
| `/` | static | ✅ | |
| `/about`, `/plan`, `/code-of-conduct`, `/contributing` | static | ✅ | |
| `/auths/login`, `/auths/request-access`, `/auths/forgot-password` | static | ✅ | |
| `/post` | static | ✅ | Guest-readable feed |
| `/post/[group]/[title]/[postId]` | `generateMetadata` | ✅ | Post title, excerpt, `og:type=article`, `article:published_time` |
| `/profile/[username]` | `generateMetadata` | ✅ | Name and handle, `og:type=profile` |
| `/profile/[username]/followers`, `/following` | `generateMetadata` | ✅ | Converted from client to server pages |
| `/auths/password-reset`, `/auths/investor-thanks` | static | noindex | Token / thank-you pages |
| `/settings`, `/notifications`, `/manage-invites`, `/control-panel`, `/profile` | static | noindex | Signed-in |
| `/profile/[username]/edit` | `generateMetadata` | noindex | Signed-in |
| `/profile/[username]/avatar` | `layout.tsx` | noindex | Page is a large client component, so metadata lives in a layout |
| `/error`, `/auths/error-page`, `/unauth`, `/logout` | static | noindex | |
| `/dashboard/[[...path]]` | — | — | Server `redirect()` only; no page is rendered |
| `/terms`, `/auths/signup` | unchanged | ✅ | Left alone until #568 and #569 merge; they still inherit root OG tags |

## Rendered `<head>` checks

Public routes (`Twitterbot/1.0` user agent):

| Route | `<title>` | `og:url` / canonical | `og:type` |
| --- | --- | --- | --- |
| `/` | Quote.Vote – Share Ideas. Vote on What Matters. | `/` | website |
| `/about` | About — Quote.Vote | `/about` | website |
| `/auths/login` | Sign In — Quote.Vote | `/auths/login` | website |
| `/post/quotevote/quote.vote-is-open-source/6acc…6bdd` | Quote.Vote is Open Source — Quote.Vote | same path | article |
| `/post/x/y/000000000000000000000000` (missing post) | Post — Quote.Vote, `noindex, nofollow` | same path | article |
| `/profile/louisgirifalco` | Louis Girifalco (@louisgirifalco) — Quote.Vote | `/profile/louisgirifalco` | profile |
| `/profile/sevan` (empty display name) | @sevan — Quote.Vote | `/profile/sevan` | profile |
| `/profile/no-such-user-zz9` (unknown user) | @no-such-user-zz9 — Quote.Vote, `noindex, nofollow` | `/profile/no-such-user-zz9` | profile |
| `/profile/louisgirifalco/followers` | Followers · @louisgirifalco — Quote.Vote | `/profile/louisgirifalco/followers` | website |

Each of these also rendered a description, `og:title`, `og:description`, `og:site_name`, `og:image`, `twitter:card=summary_large_image`, `twitter:title` and `twitter:image`. The post page's description is the first 160 characters of the post text, ending on a word boundary.

Signed-in routes, with a local session cookie (structural check only, no `JWT_SECRET`):

| Route | `<title>` | robots |
| --- | --- | --- |
| `/settings` | Settings — Quote.Vote | noindex, nofollow |
| `/notifications` | Notifications — Quote.Vote | noindex, nofollow |
| `/manage-invites` | Manage Invites — Quote.Vote | noindex, nofollow |
| `/profile` | Your Profile — Quote.Vote | noindex, nofollow |
| `/profile/louisgirifalco/edit` | Edit profile — Quote.Vote | noindex, nofollow |
| `/profile/louisgirifalco/avatar` | Edit avatar — Quote.Vote | noindex, nofollow |
| `/control-panel` | Control Panel — Quote.Vote | noindex, nofollow |

Other checks:

- `GET /opengraph-image` → `200 image/png`, 1200×630.
- `GET /robots.txt` → allows `/`, disallows private areas, and points to `<site>/sitemap.xml`.
- `GET /sitemap.xml` → 160 URLs: 8 static pages, 126 posts and 26 profiles, all on the site's own origin.
- **Streaming metadata:** Twitterbot, facebookexternalhit and Slackbot receive post metadata inside `<head>`. A regular browser user agent receives it streamed after the initial HTML, which is standard Next.js 16 behavior and doesn't affect link previews.

## Build result

`pnpm build` (Next.js 16.1.1): exit 0, compiled and type-checked, 19 static pages generated (including `/opengraph-image`, `/robots.txt` and `/sitemap.xml`), no metadata warnings. `pnpm lint`: 0 errors (3 existing warnings in unrelated files). `pnpm test`: 200 suites, 2309 tests passing.

The only build warning was the Node engine mismatch on the verifying machine (Node 22 vs `engines.node: 24.x`).

## Still to do

- **External preview tools** (opengraph.xyz, LinkedIn Post Inspector, X card validator) need a public URL. Run them against the Vercel preview for the PR once a maintainer authorizes the deployment.
- **Google Rich Results Test** for a post and a profile, after #94 (JSON-LD) lands.
- **`/terms` and `/auths/signup`** should switch to `buildPageMetadata()` after #568 and #569 merge.
- **Production `NEXT_PUBLIC_SITE_URL`:** set it to `https://beta.quote.vote` in the hosting environment (moves to `https://quote.vote` at the 2.0 launch). Without it, Vercel deployments fall back to the project's production domain.
- **Unused legacy helpers:** `src/components/common/SEOHead.tsx` and `src/hooks/useSEOHead.ts` are only used by their own tests and could be removed in a separate cleanup.
