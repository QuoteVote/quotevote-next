---
name: migrate-component
description: Migrate a legacy frontend React component from quotevote-monorepo to quotevote-next Next.js 16 TypeScript frontend
argument-hint: [component-name]
---

# Migrate Frontend Component: $ARGUMENTS

You are migrating a React component from the legacy React 17/Vite/MUI frontend to the new Next.js 16/TypeScript/shadcn/ui frontend.

## Step 1: Find the legacy component

Read the legacy reference doc at `.claude/skills/migrate-component/legacy-client-reference.md` and find the component named `$ARGUMENTS`. Understand:
- What it renders and its visual structure
- Its props interface
- Its local state and Redux state dependencies
- Which GraphQL operations it uses (queries, mutations, subscriptions)
- Its event handlers and business logic
- Its child components
- Its MUI styling

If the component is not found in the reference doc, read the legacy source directly at `/Users/mattpolini/Documents/quotevote-monorepo/client/src/` to find it.

## Step 2: Check current state

Search `quotevote-frontend/src/` to see:
- Whether this component already exists (check `src/components/`, `src/app/components/`, `src/app/`)
- What related components exist that it might depend on
- What GraphQL operations exist in `src/graphql/`
- What Zustand store slices exist in `src/store/`
- What types exist in `src/types/`
- What hooks exist in `src/hooks/`

If the component already exists, read it to understand what's already been migrated and what's missing or stubbed.

## Step 3: Apply migration transforms

Apply these transformations from legacy → new:

### Framework
- React Router hooks → Next.js hooks (`useRouter`, `usePathname`, `useSearchParams` from `next/navigation`)
- `<Link>` from react-router-dom → `<Link>` from `next/link`
- File-based routing in `src/app/` directory

### State Management
- `useSelector(state => state.user)` → `useAppStore(state => state.user)` from `@/store`
- `useDispatch()` + `dispatch(action)` → Zustand store actions directly
- Redux Toolkit slices → Zustand store slices (check `src/store/useAppStore.ts`)

### Styling
- `makeStyles()` / JSS → Tailwind CSS classes
- MUI components → shadcn/ui from `@/components/ui/`
- MUI icons → lucide-react icons
- MUI Grid → Tailwind flex/grid utilities
- MUI Hidden → Tailwind responsive classes (sm:hidden, md:block, etc.)
- Color mapping: green #00CF6E, purple #791E89, red #FF6060

### TypeScript
- Add proper types for all props, state, functions
- Place type definitions in `src/types/` (use `@/types/` alias)
- Use `interface` for component props
- Never use `any`

### Components
- Default to Server Components (no `'use client'` unless needed)
- Add `'use client'` only for: hooks, event handlers, browser APIs, Apollo Client hooks
- Use `@/` path aliases for all imports (never relative imports)

## Step 4: Generate the migration

Produce:
1. **Type definitions** — Props interfaces, related types in `src/types/`
2. **Component file** — The migrated component in appropriate location:
   - Shared components: `src/components/`
   - Page-specific: `src/app/components/`
   - shadcn/ui: `src/components/ui/`
   - Pages: `src/app/[route]/page.tsx`
3. **Hook** (if extracting logic) — In `src/hooks/`
4. **GraphQL operations** (if new ones needed) — In `src/graphql/`
5. **Tests** — In `src/__tests__/components/` with `.test.tsx` extension
6. **Zustand store updates** (if new state needed) — In `src/store/`

## Step 5: Verify

After generating the code:
- Run `pnpm type-check` in `quotevote-frontend/` to verify types
- Run `pnpm test` to verify tests pass
- Run `pnpm lint` to check for lint issues
