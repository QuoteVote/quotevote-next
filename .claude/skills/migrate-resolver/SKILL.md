---
name: migrate-resolver
description: Migrate a legacy backend GraphQL resolver from quotevote-monorepo to quotevote-next TypeScript backend
argument-hint: [resolver-name]
---

# Migrate Backend Resolver: $ARGUMENTS

You are migrating a GraphQL resolver from the legacy JavaScript backend to the new TypeScript backend.

## Step 1: Find the legacy resolver

Read the legacy reference doc at `.claude/skills/migrate-resolver/legacy-server-reference.md` and find the resolver named `$ARGUMENTS`. Understand:
- What it does (query, mutation, or subscription)
- Its input parameters and return type
- Which Mongoose models it uses
- What side effects it has (notifications, activity logging, PubSub events, email)
- Its relationship resolvers (if any)

If the resolver is not found in the reference doc, read the legacy source directly at `/Users/mattpolini/Documents/quotevote-monorepo/server/app/data/resolvers/` to find it.

## Step 2: Check current state

Search `quotevote-backend/app/` to see:
- What models already exist in `app/data/models/`
- What resolvers already exist in `app/data/resolvers/`
- What types already exist in `app/types/`
- What utilities already exist in `app/data/utils/`

## Step 3: Generate the TypeScript migration

Follow these conventions for the new backend:
- **Path aliases**: Use `~/` prefix (maps to `app/`)
- **Types**: All type definitions go in `app/types/` — create or update files there
- **Models**: Mongoose 9 models in `app/data/models/`
- **Resolvers**: In `app/data/resolvers/` organized by domain
- **Framework**: Express 5, Apollo Server 5
- **Auth**: Use `requireAuth` from `~/data/utils/requireAuth`
- **Logging**: Use Winston logger from `~/data/utils/logger`
- **PubSub**: Use pubsub from `~/data/utils/pubsub`
- **No `any` types**: Use `unknown` if truly unknown, but prefer specific types
- **Tests**: In `app/__tests__/` with `.test.ts` extension

For each resolver, produce:
1. **Type definitions** — Input types, return types, resolver type signatures in `app/types/`
2. **Model** (if needed) — Mongoose schema + TypeScript interface in `app/data/models/`
3. **Resolver implementation** — The actual resolver function in `app/data/resolvers/`
4. **Tests** — Unit tests in `app/__tests__/`
5. **Index update** — Show how to wire the resolver into the main resolver map

## Step 4: Verify

After generating the code:
- Run `pnpm type-check` in `quotevote-backend/` to verify types
- Run `pnpm test` to verify tests pass
- Run `pnpm lint` to check for lint issues
