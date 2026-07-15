# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quote.Vote is an open-source, text-only social platform for thoughtful dialogue. This is a monorepo with two independent packages (no shared workspace root):

- **`quotevote-frontend/`** — Next.js 16 frontend (React 19, TypeScript)
- **`quotevote-backend/`** — Express 5 backend (TypeScript, Apollo Server, MongoDB)

This codebase is a **complete migration** from a legacy React 17/Vite/JavaScript stack to modern Next.js 16/TypeScript.

## Commands

All commands must be run from within the respective package directory. Use **pnpm only** (never npm or yarn).

### Frontend (`quotevote-frontend/`)

```bash
pnpm dev              # Dev server on :3000
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # TypeScript validation
pnpm format:check     # Prettier check
pnpm test             # Jest unit tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
pnpm test -- src/__tests__/foundation/layout.test.tsx  # Single unit test file
pnpm test:e2e         # Playwright E2E (all specs, desktop + mobile)
pnpm test:e2e post-submission.spec.ts  # Single E2E spec
pnpm test:e2e --grep "E2E-POST-001"    # E2E by test sheet ID
pnpm test:e2e --project=desktop post-submission.spec.ts  # One viewport
pnpm test:e2e:headed  # E2E in visible browser
pnpm test:e2e:ui      # Playwright UI debugger
```

### Backend (`quotevote-backend/`)

```bash
pnpm dev              # Dev server on :4000 (ts-node-dev)
pnpm build            # Compile to dist/
pnpm lint             # ESLint
pnpm type-check       # TypeScript validation
pnpm format:check     # Prettier check
pnpm test             # Jest tests
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:validate  # Validate Prisma schema
```

### CI checks (both packages)

CI runs `lint`, `type-check`, and `test` (Jest) for both frontend and backend on PRs to `main`/`develop`. Frontend E2E (Playwright) runs when the `E2E_AUTHOR_PASSWORD` repository secret is set.

## Architecture

### Frontend

- **Routing**: Next.js App Router (file-based, `src/app/` directory)
- **Components**: Server Components by default; add `'use client'` only when interactivity is needed
- **UI**: shadcn/ui (New York style) + Tailwind CSS 4.x + lucide-react icons. No Material-UI.
- **State**: Zustand (`src/store/`) — no Redux, no provider wrappers needed
- **Data fetching**: Apollo Client 4 for GraphQL (`src/lib/apollo/`, `src/graphql/`)
- **Forms**: React Hook Form + Zod validation (e.g. `src/lib/validation/submitPostSchema.ts` for Create Quote)
- **Testing**: Jest 30 + React Testing Library (unit, `src/__tests__/`); Playwright (E2E, `e2e/`)

**Create Quote composer** (`src/components/SubmitPost/`): required title, body, and tag; optional citation and attribution; drafts in `sessionStorage`; POST disabled until Zod validation passes. E2E uses `E2E_PUBLIC_TAG_NAME` (see `quotevote-frontend/.env.e2e.example`).

### Backend

- **Server**: Express 5 + Apollo Server 5 (GraphQL)
- **Database**: MongoDB via Mongoose 9; Prisma 6 being integrated (`prisma/schema/`)
- **Auth**: JWT (access token 15min, refresh token 7 days) + bcryptjs
- **Solid Pods**: Decentralized identity/storage via @inrupt libraries (`app/solid/`)
- **Logging**: Winston + Morgan
- **Testing**: Jest 30 + ts-jest

### Key directories

```
quotevote-frontend/
  e2e/              # Playwright E2E specs and helpers
  src/
    app/              # Pages and layouts (App Router)
    app/components/   # Page-specific components
    components/       # Shared components
    components/ui/    # shadcn/ui components
    hooks/            # Custom React hooks
    lib/apollo/       # Apollo Client setup
    lib/utils/        # Utility functions (e.g. submitPostDraft sessionStorage helpers)
    lib/constants/    # Shared constants (form limits, etc.)
    store/            # Zustand stores
    types/            # All TypeScript type definitions (mandatory location)
    graphql/          # Queries, mutations, subscriptions
    __tests__/        # Jest unit tests (mandatory location)

quotevote-backend/app/
  server.ts         # Express + Apollo entry point
  data/models/      # Mongoose models
  data/resolvers/   # GraphQL resolvers
  data/utils/       # Auth, pubsub, logging utilities
  solid/            # Solid Pods integration
  types/            # All TypeScript type definitions (mandatory location)
  __tests__/        # All test files (mandatory location)
```

## Conventions

### Path aliases (mandatory — no relative imports)

- Frontend: `@/*` → `./src/*` (e.g., `@/components/ui/button`, `@/hooks/useDebounce`, `@/types/store`)
- Backend: `~/*` → `./app/*` (e.g., `~/types/common`, `~/data/utils/authentication`)

### TypeScript

- Frontend uses strict mode; never use `any` — use `unknown` if truly unknown
- All type definitions must live in the `types/` directory of each package, imported via path alias
- All function params, return types, and component props must be typed

### Naming

- Components/Types: PascalCase (`UserProfile.tsx`, `UserState`)
- Hooks: camelCase with `use` prefix (`useDebounce.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Files match their primary export name

### Testing

- Frontend unit tests go in `src/__tests__/` (subdirs: `foundation/`, `components/`, `utils/`)
- Frontend E2E tests go in `e2e/` (`.spec.ts`; helpers in `e2e/helpers/`; env via `.env.e2e.local` from `.env.e2e.example`)
- Backend tests go in `app/__tests__/` (subdirs: `unit/`, `integration/`, `utils/`)
- Unit tests use `.test.tsx` or `.test.ts`; E2E specs use `.spec.ts`

### Formatting

- Frontend: double quotes, 100 char width, 2-space indent
- Backend: single quotes, 100 char width, 2-space indent

### shadcn/ui

- Components live in `src/components/ui/`
- Install new components with `npx shadcn@latest add [component]`
- Use `cn()` from `@/lib/utils` for className merging
