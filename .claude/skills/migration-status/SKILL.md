---
name: migration-status
description: Show migration progress by comparing legacy quotevote-monorepo against current quotevote-next implementation
---

# Migration Status Report

Generate a gap analysis comparing the legacy codebase against the current quotevote-next implementation.

## Step 1: Load legacy catalogs

Read both reference docs:
- `.claude/skills/migrate-resolver/legacy-server-reference.md` — all backend resolvers, models, services
- `.claude/skills/migrate-component/legacy-client-reference.md` — all frontend components, state, operations

## Step 2: Scan current implementation

### Backend (`quotevote-backend/app/`)
- List all files in `app/data/resolvers/` — what resolvers are implemented?
- List all files in `app/data/models/` — what models exist?
- Check `app/server.ts` — what REST endpoints and GraphQL setup exists?
- Check `app/types/` — what types are defined?

### Frontend (`quotevote-frontend/src/`)
- List all components in `src/components/` and `src/app/components/`
- Check pages in `src/app/` — which are real vs stubs (look for TODO/placeholder text)
- Check `src/graphql/` — what operations are defined?
- Check `src/store/` — what state slices exist?
- Check `src/hooks/` — what hooks exist?
- Check `src/__tests__/` — what test coverage exists?

## Step 3: Check GitHub issues

Run: `gh issue list --repo QuoteVote/quotevote-next --state open --limit 100 --json number,title,state,labels`

Map issues to migration phases and show which are Ready vs Not Ready.

## Step 4: Produce the report

Output a structured report with these sections:

### Backend Resolvers
| Resolver | Legacy | New Backend | Status |
Show every resolver from the legacy reference and whether it exists in the new backend.

### Mongoose Models
| Model | Legacy | New Backend | Status |
Show every model from legacy and whether it's been recreated.

### Frontend Components
| Component | Legacy | New Frontend | Status |
Show key components and whether they're implemented, stubbed, or missing.

### Frontend Pages
| Route | Legacy | New Frontend | Status |
Show every route and whether the page is real or a stub.

### GraphQL Operations
| Operation | Legacy Client | New Client | New Backend | Status |
Show which operations exist on both sides.

### Summary Statistics
- Backend resolvers: X/Y migrated
- Models: X/Y migrated
- Frontend components: X/Y migrated
- Pages: X/Y functional (not stubs)
- GraphQL operations: X/Y wired end-to-end

### Recommended Next Steps
Based on the gaps, suggest the highest-impact items to migrate next, considering dependencies (e.g., backend resolvers needed before frontend components can work).
