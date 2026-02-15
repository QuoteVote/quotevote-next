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
pnpm test             # Jest tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report
pnpm test -- src/__tests__/foundation/layout.test.tsx  # Single test file
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

CI runs `lint`, `type-check`, and `test` for both frontend and backend on PRs to `main`/`develop`.

## Architecture

### Frontend

- **Routing**: Next.js App Router (file-based, `src/app/` directory)
- **Components**: Server Components by default; add `'use client'` only when interactivity is needed
- **UI**: shadcn/ui (New York style) + Tailwind CSS 4.x + lucide-react icons. No Material-UI.
- **State**: Zustand (`src/store/`) — no Redux, no provider wrappers needed
- **Data fetching**: Apollo Client 4 for GraphQL (`src/lib/apollo/`, `src/graphql/`)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest 30 + React Testing Library in jsdom environment

### Backend

- **Server**: Express 5 + Apollo Server 5 (GraphQL)
- **Database**: MongoDB via Mongoose 9; Prisma 6 being integrated (`prisma/schema/`)
- **Auth**: JWT (access token 15min, refresh token 7 days) + bcryptjs
- **Solid Pods**: Decentralized identity/storage via @inrupt libraries (`app/solid/`)
- **Logging**: Winston + Morgan
- **Testing**: Jest 30 + ts-jest

### Key directories

```
quotevote-frontend/src/
  app/              # Pages and layouts (App Router)
  app/components/   # Page-specific components
  components/       # Shared components
  components/ui/    # shadcn/ui components
  hooks/            # Custom React hooks
  lib/apollo/       # Apollo Client setup
  lib/utils/        # Utility functions
  store/            # Zustand stores
  types/            # All TypeScript type definitions (mandatory location)
  graphql/          # Queries, mutations, subscriptions
  __tests__/        # All test files (mandatory location)

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

- Frontend tests go in `src/__tests__/` (subdirs: `foundation/`, `components/`, `utils/`)
- Backend tests go in `app/__tests__/` (subdirs: `unit/`, `integration/`, `utils/`)
- Use `.test.tsx` or `.test.ts` extensions

### Formatting

- Frontend: double quotes, 100 char width, 2-space indent
- Backend: single quotes, 100 char width, 2-space indent

### shadcn/ui

- Components live in `src/components/ui/`
- Install new components with `npx shadcn@latest add [component]`
- Use `cn()` from `@/lib/utils` for className merging
