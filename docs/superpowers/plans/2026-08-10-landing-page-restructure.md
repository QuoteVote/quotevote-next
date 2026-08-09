# Landing Page Restructure & PR #431 Resolution — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Model assignment for this run:** planning/task-breakdown decisions → Sonnet, code-writing steps → Haiku, review passes → Sonnet.

**Goal:** Resolve all outstanding review feedback on [PR #431](https://github.com/QuoteVote/quotevote-next/pull/431) ("Fix landing page issues #350"), then restructure routing so `/` becomes the search/explore experience and the marketing page moves to `/about`, and add an "About" entry to the top navigation.

**Architecture:**
- `upstream/main`'s `LandingPageContent.tsx` (2268 lines) is the last known-good, fully-functional marketing page (working inline search, working email capture, real footer links, rendered donation stats). This branch's `b7d894c` commit replaced it with a static 349-line "Zeplin design match" that deleted all of that functionality without replacing it — the review's core complaint. Per the confirmed decision, we restore main's functional version as the base and re-skin it with this PR's visual changes on top, instead of keeping the stripped rewrite.
- `/dashboard/explore` (component `ExploreContent.tsx`) already renders "search box + latest posts, guest-aware" — exactly what should become the new home page. It moves into a new `(app)` route group alongside `dashboard/`, sharing `dashboard/layout.tsx`'s app shell (search bar, avatar menu, mobile nav) at both `/` and `/dashboard/*` without duplicating that ~600-line file.
- The old root `page.tsx` (marketing landing) moves to `/about`, replacing the current placeholder `about/page.tsx`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 (CSS-first `@theme`/`:root` tokens in `globals.css`, no `tailwind.config.js`), Apollo Client 4, Jest 30 + RTL.

## Global Constraints

- Frontend commands run from `quotevote-frontend/`, using `pnpm` only.
- Double quotes, 100-char width, 2-space indent (frontend Prettier config).
- No relative imports — use `@/*` path alias (`@/*` → `./src/*`).
- All new/changed types live in `quotevote-frontend/src/types/`.
- Tests live in `quotevote-frontend/src/__tests__/`, `.test.tsx`/`.test.ts` extension.
- Never use `any`; use `unknown` if truly unknown.
- No hardcoded hex colors / inline `style={{ color: '#...' }}` in new or touched JSX — use `@theme` tokens from `globals.css` (matches reviewer feedback from #406 and #431).
- **No git checkout/clean/reset to a different branch inside the shared working directory.** Task 1 rebases the current branch in place — safe. Any future task that would need a *different* branch checked out must be escalated to the controller for a worktree first, never run directly in this shared checkout.

---

## Task 1: Rebase onto main and resolve the two merge conflicts

**Files:**
- Modify (conflict resolution): `quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx`
- Modify (conflict resolution): `quotevote-frontend/src/components/VotingComponents/SelectionPopover.tsx`

- [ ] **Step 1: Fetch and rebase**

```bash
git fetch upstream main
git rebase upstream/main
```

- [ ] **Step 2: Resolve the `SelectionPopover.tsx` conflict**

Take this branch's version (removes `topOffset` from the effect's dependency array):

```bash
git checkout --ours quotevote-frontend/src/components/VotingComponents/SelectionPopover.tsx
git add quotevote-frontend/src/components/VotingComponents/SelectionPopover.tsx
```

(Note: during a rebase, `--ours`/`--theirs` are swapped from their merge meaning — `--ours` here means "the branch being replayed on top", i.e. this branch's version. Verify with `git diff` before committing if unsure.)

- [ ] **Step 3: Resolve the `LandingPageContent.tsx` conflict by taking main's version wholesale**

Per the confirmed decision, main's 2268-line functional version becomes the working base (Task 2 re-skins it visually — don't try to hand-merge the conflict markers section by section):

```bash
git checkout --theirs quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx
git add quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx
```

(Same rebase caveat: `--theirs` means "upstream/main" here — verify with `git show upstream/main:quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx | diff - quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx` shows no difference before committing.)

- [ ] **Step 4: Continue and verify the rebase**

```bash
git rebase --continue
git log --oneline -5
git status
```

Expected: rebase completes cleanly, working tree is clean, branch is now based on current `upstream/main`.

- [ ] **Step 5: Report back for controller review before pushing**

Do not force-push. The controller will confirm with the user before any push.

---

## Task 2: Re-skin `LandingPageContent.tsx` with this PR's visual design, without removing functionality

**Files:**
- Modify: `quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx` (now main's 2268-line version, post-Task-1)
- Reference only (do not edit, use as the visual source of truth for section styling): capture the pre-rebase static design via `git show <pre-rebase-tip-sha>:quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx` where `<pre-rebase-tip-sha>` is the commit `b7d894c` (the "Design matching" commit) — this SHA is stable regardless of the rebase, since rebase doesn't rewrite already-shared history reachable from other refs. Save it locally:

```bash
git show b7d894c:quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx > /tmp/zeplin-design-reference.tsx
```

- [ ] **Step 1: Add the new color tokens this design introduces, to `globals.css`**

Add these inside the existing `:root { ... }` block in `quotevote-frontend/src/app/globals.css`, right after the `/* Additional Colors */` group (after the line `--color-black-card: #2D2A2A;`):

```css
  /* Landing page accent colors (Zeplin design, issue #350) */
  --color-brand-green: #1AAE5A;
  --color-brand-green-dark: #16A34A;
  --color-brand-indigo: #4F46E5;
  --color-brand-purple: #6C63FF;
  --color-donate-purple: #6C2BD9;
  --color-section-mint: #EAF6F0;
  --color-section-lavender: #F3F2FB;
  --color-section-indigo-tint: #EEF0FF;
  --color-section-slate: #F4F5F9;
  --color-footer-navy: #0A1F44;
```

These become usable as Tailwind utilities automatically (`text-brand-green`, `bg-section-mint`, etc.) because this project's `@theme` block (further down in the same file) maps `--color-*` custom properties straight into Tailwind's color palette — check the `@theme inline { ... }` block and confirm these aren't already re-declared there; if the block explicitly lists each `--color-*` var it consumes (rather than wildcard-importing `:root`), add matching `--color-brand-green: var(--brand-green);`-style entries there too, mirroring the existing pattern for `--color-primary`.

- [ ] **Step 2: Re-skin section by section, replacing arbitrary hex values with the new tokens**

Working through main's `LandingPageContent.tsx` (now the file at its post-rebase path), for each section that has an equivalent in `/tmp/zeplin-design-reference.tsx`, update:
- Copy/headline text to match the reference file's wording (e.g. hero headline "Better conversations build stronger communities.")
- Section background/text colors: replace `style={{ backgroundColor: '#EAF6F0' }}` → `className="bg-section-mint"`, `text-[#1AAE5A]` → `text-brand-green`, `text-[#4F46E5]` → `text-brand-indigo`, etc., using the new tokens from Step 1 instead of arbitrary Tailwind bracket values or inline `style`.
- Do **not** remove or restyle-away: the inline search form (`role="search" aria-label="Search conversations"`), the email capture form (see Task 4), the footer link structure (see Task 4), or the `totalRaised`/`progressPct` stat rendering — these are the functionality this task exists to preserve.
- Leave sections that don't correspond to anything in the Zeplin reference (e.g. main's existing testimonial/"what people are saying" section) as-is if the reference has no equivalent — don't delete working sections just because the static redesign lacked them.

- [ ] **Step 3: Update the internal redirect target**

Find the auth-redirect effect:

```tsx
useEffect(() => {
  if (user?.id) {
    router.push('/dashboard/explore');
  }
}, [user, router]);
```

Change the target since `/dashboard/explore` becomes `/` in Task 6:

```tsx
useEffect(() => {
  if (user?.id) {
    router.push('/');
  }
}, [user, router]);
```

- [ ] **Step 4: Run the frontend dev server and visually verify**

```bash
cd quotevote-frontend
pnpm dev
```

Open `http://localhost:3000` (still root at this point, pre-Task-6) and confirm: hero renders, inline search still works (type a query, see dropdown), email form still shows validation errors, footer links are visible, donation stats render.

- [ ] **Step 5: Commit**

```bash
git add quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx quotevote-frontend/src/app/globals.css
git commit -m "feat: re-skin landing page with Zeplin design while preserving search/email/footer functionality"
```

---

## Task 3: Deduplicate `public/assets/` and `public/images/`, rename the spaced directory

Reviewer complaint: identical retina-image sets exist in both `public/assets/` and `public/images/`. After Task 2, grep the merged `LandingPageContent.tsx` to see which directory it actually references and keep only that one for the overlapping files.

**Files:**
- Modify: `quotevote-frontend/public/assets/` and `quotevote-frontend/public/images/`
- Modify: `quotevote-frontend/public/assets/all the group of characters/` → rename

- [ ] **Step 1: Find which directory the merged component actually uses**

```bash
cd quotevote-frontend
grep -o '"/assets/[^"]*"' src/app/components/LandingPage/LandingPageContent.tsx | sort -u
grep -o '"/images/[^"]*"' src/app/components/LandingPage/LandingPageContent.tsx | sort -u
```

- [ ] **Step 2: List the overlapping filenames between the two directories**

```bash
comm -12 <(ls public/assets | sort) <(ls public/images | sort)
```

- [ ] **Step 3: For each overlapping filename, delete it from whichever directory the component does NOT reference**

Run per the Step 1 output — e.g. if the component only references `/images/frame-11.png`, delete `public/assets/frame-11.png` (and its `@2x`/`@3x` variants):

```bash
git rm public/assets/frame-11.png public/assets/frame-11@2x.png public/assets/frame-11@3x.png
```

Repeat for every overlapping basename from Step 2. Also grep the rest of the frontend (not just the landing page) before deleting each file, in case another component references the copy you're about to remove:

```bash
grep -rl "assets/frame-11" quotevote-frontend/src
```

- [ ] **Step 4: Rename the spaced directory**

```bash
cd quotevote-frontend/public/assets
git mv "all the group of characters" character-avatars
cd ../../..
grep -rl "all the group of characters" quotevote-frontend/src
```

Update every match from the grep to the new path (`character-avatars`).

- [ ] **Step 5: Run the app and confirm no broken images**

```bash
cd quotevote-frontend
pnpm dev
```

Load `/` (still root at this point) and open browser devtools Network tab — confirm zero 404s for `/assets/*` or `/images/*`.

- [ ] **Step 6: Commit**

```bash
git add -A quotevote-frontend/public
git commit -m "chore: deduplicate landing-page images and fix spaced directory name"
```

---

## Task 4: Fix footer links and wire the email capture form

**Files:**
- Modify: `quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx`
- Reference: `quotevote-frontend/src/app/auths/request-access/PageContent.tsx:32,63-72` (existing mutation-call pattern to copy)
- Reference: `quotevote-frontend/src/graphql/mutations.ts:523-530` (`REQUEST_USER_ACCESS_MUTATION`)

- [ ] **Step 1: Confirm footer link targets against real routes**

```bash
cd quotevote-frontend
for r in dashboard/explore how-it-works pricing faq mission team blog press docs community contact terms code-of-conduct contributing; do
  [ -d "src/app/$r" ] && echo "$r: EXISTS" || echo "$r: MISSING"
done
```

For every `MISSING` route currently linked in the footer, either point it at the closest real equivalent or drop the link entirely if there's genuinely nothing to point it at. Keep links to routes confirmed `EXISTS` (e.g. `/terms`, `/code-of-conduct`, `/contributing`).

- [ ] **Step 2: Wire the "Please be in touch" email form to `REQUEST_USER_ACCESS_MUTATION`**

If main's restored version (post-Task-1) already has this wired (it should — this was one of the things the static redesign broke), verify it still calls the mutation correctly and skip to Step 3. If it's still a bare `<input>`/`<button>` with no handler, add:

```tsx
'use client';
import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { REQUEST_USER_ACCESS_MUTATION } from '@/graphql/mutations';

// inside the component, alongside other hooks:
const [subscribeEmail, setSubscribeEmail] = useState('');
const [subscribeError, setSubscribeError] = useState('');
const [subscribeSuccess, setSubscribeSuccess] = useState(false);
const [requestAccess, { loading: subscribeLoading }] = useMutation(REQUEST_USER_ACCESS_MUTATION);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const handleSubscribe = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubscribeError('');
  if (!EMAIL_PATTERN.test(subscribeEmail)) {
    setSubscribeError('Please enter a valid email address');
    return;
  }
  try {
    await requestAccess({ variables: { requestUserAccessInput: { email: subscribeEmail } } });
    setSubscribeSuccess(true);
    setSubscribeEmail('');
  } catch {
    setSubscribeError('Something went wrong. Please try again.');
  }
};
```

Replace the bare `<input>`/`<button>` markup with:

```tsx
<form onSubmit={handleSubscribe} className="flex w-full max-w-[280px] flex-col gap-2">
  <div className="flex h-[48px] rounded-[12px] overflow-hidden border border-[#E5E5E5] focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green">
    <input
      type="email"
      value={subscribeEmail}
      onChange={(e) => setSubscribeEmail(e.target.value)}
      placeholder="you@example.com"
      aria-label="Email address"
      className="bg-transparent px-4 h-full text-[13px] flex-1 focus:outline-none min-w-0"
    />
    <button
      type="submit"
      disabled={subscribeLoading}
      className="bg-brand-green text-white px-6 h-full text-[13px] font-bold hover:opacity-90 transition-colors flex-shrink-0 disabled:opacity-60"
    >
      {subscribeLoading ? 'Sending…' : 'Subscribe'}
    </button>
  </div>
  {subscribeError && <p className="text-[12px] text-destructive">{subscribeError}</p>}
  {subscribeSuccess && <p className="text-[12px] text-brand-green">Thanks — we'll be in touch!</p>}
</form>
```

- [ ] **Step 3: Write a test for the subscribe form**

Add to `quotevote-frontend/src/__tests__/app/page.test.tsx` (relocated per Task 9) inside the existing `describe('Be in Touch email form', ...)` block (or create it if it doesn't survive the rebase):

```tsx
it('submits a valid email via REQUEST_USER_ACCESS_MUTATION', async () => {
  const mockRequestAccess = jest.fn().mockResolvedValue({ data: {} });
  mockUseMutation.mockReturnValue([mockRequestAccess, { loading: false }]);
  const user = userEvent.setup();
  renderLandingPage();

  await user.type(screen.getByLabelText(/email address/i), 'reader@example.com');
  await user.click(screen.getByRole('button', { name: /subscribe/i }));

  await waitFor(() => {
    expect(mockRequestAccess).toHaveBeenCalledWith({
      variables: { requestUserAccessInput: { email: 'reader@example.com' } },
    });
  });
});
```

- [ ] **Step 4: Run the test**

```bash
cd quotevote-frontend
pnpm test -- src/__tests__/app/page.test.tsx -t "submits a valid email"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx quotevote-frontend/src/__tests__/app/page.test.tsx
git commit -m "fix: wire footer links to real routes and functioning email capture form"
```

---

## Task 5: Remove the now-truly-unused `totalRaised`/`progressPct` underscore-prefix workaround

This was already fixed by Task 1 (main's version uses these props for real — renders them in the stats list and the donation progress bar). This task is just a verification checkpoint.

- [ ] **Step 1: Confirm no `_totalRaised`/`_progressPct` underscore-prefixed remnants exist**

```bash
cd quotevote-frontend
grep -n "_totalRaised\|_progressPct" src/app/components/LandingPage/LandingPageContent.tsx src/app/page.tsx
```

Expected: no matches. If any remain, remove the underscore prefix and confirm the value is actually rendered somewhere in the JSX (per Task 2, Step 2's note not to remove the stat rendering).

---

## Task 6: Move `/dashboard/explore` to become the new root `/`, keep `/dashboard/explore` as a redirect

This is the "make the new root directory what is currently /search" change, using a Next.js route group so `dashboard/layout.tsx`'s app shell (search bar, avatar menu, mobile bottom nav) wraps both `/` and the remaining `/dashboard/*` routes without duplicating that file.

**Files:**
- Move: `quotevote-frontend/src/app/dashboard/` → `quotevote-frontend/src/app/(app)/dashboard/`
- Move: `quotevote-frontend/src/app/(app)/dashboard/layout.tsx` → `quotevote-frontend/src/app/(app)/layout.tsx`
- Move: `quotevote-frontend/src/app/(app)/dashboard/explore/page.tsx` → `quotevote-frontend/src/app/(app)/page.tsx`
- Move: `quotevote-frontend/src/app/(app)/dashboard/explore/ExploreContent.tsx` → `quotevote-frontend/src/app/(app)/ExploreContent.tsx`
- Move: `quotevote-frontend/src/app/(app)/dashboard/explore/loading.tsx` → `quotevote-frontend/src/app/(app)/loading.tsx`
- Create: `quotevote-frontend/src/app/(app)/dashboard/explore/page.tsx` (redirect stub)
- Delete: `quotevote-frontend/src/app/page.tsx` (old root — content already moved to `/about` in Task 7)

- [ ] **Step 1: Move the dashboard folder into a route group**

```bash
cd quotevote-frontend/src/app
mkdir "(app)"
git mv dashboard "(app)/dashboard"
git mv "(app)/dashboard/layout.tsx" "(app)/layout.tsx"
```

- [ ] **Step 2: Move explore's content out to become the group's root page**

```bash
git mv "(app)/dashboard/explore/page.tsx" "(app)/page.tsx"
git mv "(app)/dashboard/explore/ExploreContent.tsx" "(app)/ExploreContent.tsx"
git mv "(app)/dashboard/explore/loading.tsx" "(app)/loading.tsx"
```

- [ ] **Step 3: Update the import path inside the moved page**

In `quotevote-frontend/src/app/(app)/page.tsx`, the import `import ExploreContent from './ExploreContent'` stays correct (same relative directory) — verify it, and update `BASE_URL`:

```tsx
const BASE_URL = '/'
```

(was `'/dashboard/explore'`)

- [ ] **Step 4: Create the redirect stub for the old explore URL**

Create `quotevote-frontend/src/app/(app)/dashboard/explore/page.tsx`:

```tsx
import { redirect } from 'next/navigation'

export default function ExploreRedirect() {
  redirect('/')
}
```

- [ ] **Step 5: Update every hardcoded `/dashboard/explore` reference to `/`**

```bash
cd quotevote-frontend
grep -rln "/dashboard/explore" src --include=*.tsx --include=*.ts | grep -v __tests__
```

For each file in the output, replace the literal string `'/dashboard/explore'` (and `"/dashboard/explore"`) with `'/'`. Confirmed call sites from the earlier repo scan:
- `src/app/auths/(card)/signup/PageContent.tsx:102`
- `src/app/auths/(split)/login/PageContent.tsx:40,65`
- `src/app/error/PageContent.tsx:24`
- `src/components/Post/Post.tsx:268`
- `src/components/SubmitPost/SubmitPostForm.tsx:148`
- `src/app/(app)/layout.tsx` (moved in Step 1): `NAV_PAGES` entry `{ path: '/dashboard/explore', page: 'home' }` → `{ path: '/', page: 'home' }`; the `isActive('/dashboard/explore')` checks (desktop nav-color check, mobile bottom-nav Home tab); the `Link href="/dashboard/explore"` on both the desktop and mobile logo; the `maxWidth` `pathname.startsWith('/dashboard/explore')` check — change to `pathname === '/'`
- `src/components/Navbars/NavSearch.tsx:15`: `const isExplorePage = pathname === '/dashboard/explore' || pathname.startsWith('/dashboard/explore');` → `const isExplorePage = pathname === '/';`
- `src/lib/dashboard-routes.ts:6`: `GUEST_READABLE_PREFIXES = ['/dashboard/explore', '/dashboard/post']` → `['/', '/dashboard/post']`
- `src/lib/utils/chatLayout.ts:12`: entry `'/dashboard/explore'` in the persistent-chat-panel route list → `'/'`

Note `isActive`/`startsWith` helpers used elsewhere treat `path + '/'` as a prefix match — confirm `isActive('/')` doesn't now match every route by checking the `isActive` implementation in `(app)/layout.tsx` (`pathname === path || pathname.startsWith(path + '/')`) — `pathname.startsWith('/' + '/')` (`'//'`) never matches a real pathname, so this is safe as-is, but re-verify after the edit.

- [ ] **Step 6: Fix the pre-existing dead `/search` links to point at `/`**

These already point at a nonexistent route today — fix them as part of this restructure:

```bash
cd quotevote-frontend
grep -rln "'/search'\|\"/search\"" src --include=*.tsx --include=*.ts | grep -v __tests__
```

Update each to `/`:
- `src/components/Activity/ActivityEmptyList.tsx:16`
- `src/components/Sidebar/Sidebar.tsx:210,213`
- `src/components/Navbars/MainNavBar.tsx:71`
- `src/components/RequestAccess/Plans/Plans.tsx:28`
- `src/components/Profile/ProfileView.tsx:25`

- [ ] **Step 7: Delete the old root page (content already relocated to `/about` — see Task 7)**

```bash
git rm quotevote-frontend/src/app/page.tsx
```

Only run this after Task 7 has confirmed the content is safely at `/about`.

- [ ] **Step 8: Run the frontend and manually verify routing**

```bash
cd quotevote-frontend
pnpm dev
```

Verify: `/` renders the search box + latest posts (same content that used to be at `/dashboard/explore`), `/dashboard/explore` redirects to `/`, `/dashboard/post`, `/dashboard/profile`, etc. still render normally with the same header/sidebar/bottom-nav chrome as before, sign-in from `/` still works, an authenticated user's avatar menu still shows.

- [ ] **Step 9: Run the full frontend test suite and fix any path-assertion breakage**

```bash
cd quotevote-frontend
pnpm test 2>&1 | tail -100
```

Fix any test that asserts on the literal string `/dashboard/explore` or `/search` to instead assert `/`, per the same file list as Steps 5–6.

- [ ] **Step 10: Commit**

```bash
git add -A quotevote-frontend/src/app
git commit -m "feat: move search/explore to root, redirect /dashboard/explore, fix dead /search links"
```

---

## Task 7: Move the marketing landing page to `/about`

**Files:**
- Modify: `quotevote-frontend/src/app/about/page.tsx` (replace placeholder content)
- Reference: `quotevote-frontend/src/app/page.tsx` (pre-deletion — run this task before Task 6 Step 7)

- [ ] **Step 1: Replace the placeholder About page with the landing page shell**

Overwrite `quotevote-frontend/src/app/about/page.tsx` (currently a simple `PublicNavbar` + 3 cards placeholder) with the same server-component shell the root page used to have:

```tsx
import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import { LandingPageContent } from '@/app/components/LandingPage/LandingPageContent';

const COLLECTIVE_GOAL = 1000; // USD — denominator for the progress bar

async function fetchCollectiveStats(): Promise<{ totalRaised: string; progressPct: number }> {
  try {
    const res = await fetch('https://api.opencollective.com/graphql/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ collective(slug: "quotevote") { stats { totalAmountReceived { value } } } }`,
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Open Collective API ${res.status}`);

    const json = (await res.json()) as {
      data?: { collective?: { stats?: { totalAmountReceived?: { value?: number } } } };
    };

    const value = json?.data?.collective?.stats?.totalAmountReceived?.value ?? 0;
    if (!value) return { totalRaised: '$500+', progressPct: 50 };

    const totalRaised = `$${Math.floor(value).toLocaleString('en-US')}`;
    const progressPct = Math.min(Math.round((value / COLLECTIVE_GOAL) * 100), 100);

    return { totalRaised, progressPct };
  } catch {
    return { totalRaised: '$500+', progressPct: 50 };
  }
}

export const metadata: Metadata = {
  title: 'About — Quote.Vote',
  description:
    'Learn about Quote.Vote — an open-source, text-first platform for thoughtful dialogue. Quote, vote, and engage — no ads, no algorithms, no noise.',
  keywords: [
    'quote',
    'vote',
    'dialogue',
    'civic engagement',
    'open source',
    'democracy',
    'discussion',
  ],
  authors: [{ name: 'Quote.Vote Team' }],
  openGraph: {
    title: 'About Quote.Vote',
    description:
      'An open-source, text-first platform for thoughtful dialogue. Quote, vote, and engage — no ads, no algorithms.',
    type: 'website',
    url: 'https://quote.vote/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Quote.Vote',
    description: 'An open-source, text-first platform for thoughtful dialogue.',
  },
};

/**
 * About Page (Server Component Shell)
 *
 * Route `/about`. Renders the LandingPageContent client component: navbar,
 * hero, features, community sections, and footer. Redirects logged-in
 * visitors to `/` (see LandingPageContent's auth-redirect effect).
 */
export default async function AboutPage(): Promise<ReactElement> {
  const { totalRaised, progressPct } = await fetchCollectiveStats();
  return <LandingPageContent totalRaised={totalRaised} progressPct={progressPct} />;
}
```

- [ ] **Step 2: Update internal links that pointed at the old landing page's logo/home target**

Inside `LandingPageContent.tsx`, the navbar/footer logo `<Link href="/">` entries were correct when this was the root page — now that it lives at `/about` and `/` is a different page, decide per-link:
- The brand logo link (top-left, "Quote.Vote home") should go to `/` (the actual app home) — leave as `href="/"`, this is correct and unchanged.
- Any in-page anchor links (`href="/#about-section"`) need to become `href="/about#about-section"` since the anchor now lives on `/about`, not `/`.

```bash
cd quotevote-frontend
grep -n 'href="/#' src/app/components/LandingPage/LandingPageContent.tsx
```

Update each match from `/#...` to `/about#...`.

- [ ] **Step 3: Run the dev server and verify**

```bash
cd quotevote-frontend
pnpm dev
```

Visit `/about` — confirm the full marketing page renders (hero, search, features, footer). Visit `/` — confirm it's untouched by this task (still whatever Task 6 has or hasn't done yet, depending on execution order).

- [ ] **Step 4: Commit**

```bash
git add quotevote-frontend/src/app/about/page.tsx quotevote-frontend/src/app/components/LandingPage/LandingPageContent.tsx
git commit -m "feat: move marketing landing page to /about"
```

---

## Task 8: Add an "About" link to the top navigation

Two navigation surfaces need it: `PublicNavbar` (shown on `/about` itself and the auth pages) and the app shell header at `(app)/layout.tsx` (shown on `/` and all `/dashboard/*` routes, for both guests and signed-in users, after Task 6).

**Files:**
- Modify: `quotevote-frontend/src/components/PublicNavbar/PublicNavbar.tsx`
- Modify: `quotevote-frontend/src/app/(app)/layout.tsx`

- [ ] **Step 1: Add "About" to `PublicNavbar`**

In `quotevote-frontend/src/components/PublicNavbar/PublicNavbar.tsx`, add a new link next to the existing "Home" link:

```tsx
<Link
  href="/about"
  className="px-3 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] hidden sm:block"
  style={{ color: '#475569' }}
>
  About
</Link>
```

- [ ] **Step 2: Add "About" to the app shell header (desktop)**

In `quotevote-frontend/src/app/(app)/layout.tsx`, in the desktop header's "Right: Actions" section, add an About link next to the guest "Sign in" button / before the avatar dropdown for logged-in users, so it's visible regardless of auth state:

```tsx
<Link
  href="/about"
  className="hidden lg:flex items-center h-9 px-3 rounded-full text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
>
  About
</Link>
```

Place this immediately before the `{/* Create */}` button's opening tag in the "Right: Actions" `<div>`.

- [ ] **Step 3: Add "About" to the avatar dropdown menu for signed-in users**

In the same file's `DropdownMenuContent`, add an item after the "Settings & Privacy" `DropdownMenuItem` and before the admin-only conditional block:

```tsx
<DropdownMenuItem onClick={() => router.push('/about')} className="cursor-pointer rounded-lg gap-3 py-2.5 px-3">
  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
    <Info className="size-4 text-muted-foreground" />
  </div>
  <div>
    <p className="text-[13px] font-semibold">About Quote.Vote</p>
    <p className="text-[11px] text-muted-foreground">Mission and platform info</p>
  </div>
</DropdownMenuItem>
```

Add `Info` to the existing `lucide-react` import list at the top of the file.

- [ ] **Step 4: Write a test for the PublicNavbar About link**

Add to `quotevote-frontend/src/__tests__/components/PublicNavbar/PublicNavbar.test.tsx` (create the file if it doesn't exist yet — check first):

```tsx
import { render, screen } from '../../utils/test-utils';
import { PublicNavbar } from '@/components/PublicNavbar/PublicNavbar';

describe('PublicNavbar', () => {
  it('renders an About link pointing to /about', () => {
    render(<PublicNavbar />);
    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toHaveAttribute('href', '/about');
  });
});
```

- [ ] **Step 5: Run the test**

```bash
cd quotevote-frontend
pnpm test -- src/__tests__/components/PublicNavbar/PublicNavbar.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add quotevote-frontend/src/components/PublicNavbar/PublicNavbar.tsx quotevote-frontend/src/app/(app)/layout.tsx quotevote-frontend/src/__tests__/components/PublicNavbar/PublicNavbar.test.tsx
git commit -m "feat: add About link to top navigation (PublicNavbar and app shell header)"
```

---

## Task 9: Relocate and fix the landing-page test suite

The existing `quotevote-frontend/src/__tests__/app/page.test.tsx` was written against a version of `LandingPageContent` very close to main's restored version (Task 1) — most assertions should already match. It needs relocating (since the content now lives at `/about`, not `/`) and its two `/dashboard/explore` references updated.

**Files:**
- Move: `quotevote-frontend/src/__tests__/app/page.test.tsx` → `quotevote-frontend/src/__tests__/app/about.test.tsx`

- [ ] **Step 1: Move the test file**

```bash
cd quotevote-frontend
git mv src/__tests__/app/page.test.tsx src/__tests__/app/about.test.tsx
```

- [ ] **Step 2: Update the file's top comment and the redirect-target assertion**

In `src/__tests__/app/about.test.tsx`, update the header comment:

```tsx
/**
 * About Page Tests
 *
 * Covers: rendering, section presence, navigation links,
 * auth redirect, smooth-scroll, accessibility, and inline search.
 */
```

Update the redirect test (around the `'redirects authenticated users to /dashboard/explore'` case) to match Task 2 Step 3's new redirect target:

```tsx
it('redirects authenticated users to /', async () => {
  useAppStore.getState().setUserData({
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
  });

  renderLandingPage();

  await waitFor(() => {
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
```

Also update the `usePathname` mock at the top of the file from `() => '/'` to `() => '/about'`, and the "redirects to /dashboard/explore when clicking a content result" test — this assertion is about search-result click-through, which is unrelated to the page's own route and should stay `/dashboard/explore?q=...` only if that route still exists as a valid destination; since Task 6 makes `/dashboard/explore` a redirect to `/`, update this assertion to `'/?q=Democracy%20Matters'` instead.

- [ ] **Step 3: Run the full test file**

```bash
cd quotevote-frontend
pnpm test -- src/__tests__/app/about.test.tsx 2>&1 | tail -80
```

- [ ] **Step 4: Fix any remaining failures**

Common expected mismatches to check for, given Task 2's re-skin changed copy/classNames:
- Heading text assertions (e.g. `/share ideas/i`, `/built for meaningful conversations/i`) — update the regex if Task 2 changed the literal heading text to match the Zeplin copy.
- Footer section names (`Company`, `Quick Links`, `Resources`, `Connect`) — update if Task 4 renamed footer columns.
- Any assertion on a link that Task 4 removed (dead footer links) — remove the corresponding test expectation.

For each failure, read the actual rendered output the test reports and reconcile the assertion with Task 2/4's actual final markup — do not loosen assertions just to make them pass; if a test fails because real functionality regressed, fix the component instead.

- [ ] **Step 5: Run the full frontend test suite one more time**

```bash
cd quotevote-frontend
pnpm test 2>&1 | tail -50
```

Expected: all suites pass.

- [ ] **Step 6: Commit**

```bash
git add quotevote-frontend/src/__tests__/app/about.test.tsx
git commit -m "test: relocate landing page tests to about.test.tsx, update redirect targets"
```

---

## Task 10: Final verification and PR update

- [ ] **Step 1: Run full CI-equivalent checks for the frontend**

```bash
cd quotevote-frontend
pnpm lint
pnpm type-check
pnpm format:check
pnpm test
pnpm build
```

Fix any failures before proceeding.

- [ ] **Step 2: Manual smoke test of the full flow**

```bash
pnpm dev
```

- Visit `/` as a guest: confirm search box + latest posts render, "About" link visible in the header, clicking it goes to `/about`.
- Visit `/about`: confirm hero/features/footer render, email form validates and submits, footer links all resolve (no 404s), clicking "Explore Discussions" or equivalent CTA lands on `/`.
- Sign in, confirm redirect from `/about` to `/`, confirm avatar dropdown shows "About Quote.Vote", confirm `/dashboard/explore` redirects to `/`.
- Confirm `/dashboard/post`, `/dashboard/profile`, `/dashboard/notifications`, `/dashboard/settings` all still render with the full app shell (sidebar/header/bottom-nav) unchanged.

- [ ] **Step 3: Report back to the controller**

Do not push or edit the live GitHub PR — report completion to the controller, who will confirm with the user before any push or PR edit.

---

## Self-Review Notes

- **Spec coverage:** Task 1 → merge conflicts + removed-functionality complaint (root cause fix, not patched over). Task 2 → hardcoded-colors complaint + Zeplin design retained. Task 3 → duplicate images + spaced directory. Task 4 → footer dead links + non-functional email capture (both flyblackbox and Codex review comments). Task 5 → unused-props complaint. Task 6 → user's root/`/search` swap instruction. Task 7 → user's root→`/about` instruction. Task 8 → user's "About" nav button instruction. Task 9 → test suite consistency. Task 10 → final CI + PR description update.
- **Sequencing:** Task 7 must run before Task 6 Step 7 (deleting the old root page) so content isn't lost. Task 9 depends on Tasks 2, 4, and 7 all being done, since it asserts against their final output.
- **Note (2026-08-10):** The originally-planned Task 0 (extracting 3 unrelated lint fixes into a separate PR) was abandoned per explicit user instruction, to keep this plan focused on the landing page / routing work. Its branch `fix/unrelated-ci-lint-fixes` was pushed to `origin` but no PR was opened; it can be revisited later if desired. Task numbering below retained as originally written (starts at Task 1) for continuity with prior ledger entries.
