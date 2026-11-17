# Quote.Vote Backend

The Quote.Vote backend serves the platform's GraphQL API, real-time subscriptions, and authentication endpoints. It is an Express 5 application written in strict TypeScript, using Apollo Server, Prisma, and MongoDB.

> **Migration status (2.0 staging):** The TypeScript/Apollo/Prisma architecture is implemented, while some legacy Mongoose paths remain during the migration. The `staging` branch is the integration branch for the 2.0 backend cutover; `main` continues to support the current beta until the coordinated switch. See [#637](https://github.com/QuoteVote/quotevote-next/issues/637), [#169](https://github.com/QuoteVote/quotevote-next/issues/169), and [#182](https://github.com/QuoteVote/quotevote-next/issues/182) for current release status.

## Technology

| Area | Current implementation |
| --- | --- |
| Runtime | **Node.js 24** (CI and production Docker image) |
| Package manager | **pnpm 9** (CI and Docker use pnpm 9; Docker pins 9.15.9) |
| Language | **TypeScript 5**, strict mode; compiled as CommonJS |
| HTTP API | **Express 5** with CORS |
| GraphQL | **Apollo Server 5**, GraphQL 16, Express 5 integration |
| Real-time | **graphql-ws** subscriptions over WebSocket |
| Persistence | **MongoDB** with **Prisma 6**; remaining **Mongoose 9** code is transitional |
| Authentication | JWT-based sessions, invitation-based onboarding |
| Testing | Jest 30 / ts-jest; GraphQL contract validation; GitHub Actions |
| Deployment | Multi-stage Node 24 Docker image with health check and graceful shutdown |

The installed dependency versions are defined in [package.json](package.json), rather than guaranteed by the table above.

## Repository layout and request flow

```text
quotevote-next/
├── quotevote-backend/
│   ├── app/
│   │   ├── start.ts            # Production entry; registers compiled path aliases
│   │   ├── server.ts           # Express/Apollo startup, routes, shutdown
│   │   ├── context.ts          # Typed HTTP/WebSocket GraphQL context
│   │   ├── lib/prisma.ts       # Shared Prisma Client lifecycle
│   │   ├── subscriptions.ts    # graphql-ws subscription server
│   │   ├── data/
│   │   │   ├── schema.ts       # Executable GraphQL schema
│   │   │   ├── resolvers/      # Domain operations
│   │   │   ├── utils/          # Authentication and shared utilities
│   │   │   └── models/         # Remaining legacy Mongoose models
│   │   └── solid/             # Solid Pod integration (still being completed)
│   ├── prisma/schema/         # Multi-file Prisma schema, mapped to MongoDB
│   ├── __tests__/             # Jest unit and integration tests
│   ├── scripts/               # Data checks, migration scripts, seeds
│   ├── Dockerfile
│   └── package.json
├── quotevote-frontend/
└── docs/
```

- The HTTP GraphQL endpoint is **`/graphql`**. Apollo uses the executable schema in `app/data/schema.ts` and the context factory in `app/context.ts`.
- GraphQL subscriptions use the WebSocket server in `app/subscriptions.ts`.
- Existing REST authentication endpoints include **`/auth/login`**, **`/auth/refresh`**, and **`/auth/register`**. Direct registration is intentionally refused; onboarding follows the invitation/access-request workflows.
- **`GET /health`** returns a health response based on the current server's connection/shutdown state. The transitional implementation still checks Mongoose connectivity.
- Resolvers should use the injected **`context.prisma`**. The application-level Prisma singleton belongs in startup, context construction, and utilities where direct access is explicitly justified.
- **`~/*`** resolves to **`app/*`**. The production entry point registers this alias for compiled JavaScript.

## Prerequisites

1. **Node.js 24** and **pnpm 9**. Match CI and the backend Docker image when reproducing build or test failures.
2. **MongoDB**, preferably a local replica set or an isolated MongoDB Atlas development database. Prisma operations involving transactions require a compatible MongoDB deployment.
3. A local **`.env`** containing your own development credentials. Never commit secrets or connect destructive test scripts to production data.

## Local development

Clone and install from the backend directory:

```bash
git clone https://github.com/QuoteVote/quotevote-next.git
cd quotevote-next/quotevote-backend
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --ignore-workspace
```

Create `quotevote-backend/.env` with values suitable for your **isolated local database**:

```dotenv
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/quotevote_dev?replicaSet=rs0
DATABASE_URL=mongodb://127.0.0.1:27017/quotevote_dev?replicaSet=rs0
JWT_SECRET=replace-with-a-long-random-local-development-secret
CLIENT_URL=http://localhost:3000
```

The example assumes a local replica set named `rs0`; use the actual hostname, replica-set name, and connection options of your MongoDB installation. **`MONGO_URI`** is used by the remaining Mongoose connection, while **`DATABASE_URL`** is used by Prisma. Point both at the same intended development database for migration testing.

Other configuration depends on the feature being exercised:

| Setting | Purpose |
| --- | --- |
| `TRUST_PROXY` | Configure only for a known reverse proxy (e.g., `1` for one trusted hop); leave unset locally |
| `SENDGRID_API_KEY`, `SENDGRID_SENDER_EMAIL` | Transactional email integration |
| `SENDGRID_MOCK_BASE_URL` | Local SendGrid mock for the email E2E specs (`pnpm sendgrid:mock`); see `quotevote-frontend/.env.e2e.example` |
| `SOLID_TOKEN_ENCRYPTION_KEY` and other `SOLID_*` settings | Solid integration; see `app/solid/README.md` and issue [#511](https://github.com/QuoteVote/quotevote-next/issues/511) |

Generate the Prisma client, validate the schema, and start the dev server:

```bash
pnpm prisma:generate
pnpm prisma:validate
pnpm dev
```

By default, the API listens at **http://localhost:4000** and serves GraphQL at **http://localhost:4000/graphql**. To check the running service:

```bash
curl -i http://localhost:4000/health
```

Run the frontend separately from `quotevote-frontend/` and configure its backend URL as documented in the [frontend README](../quotevote-frontend/README.md).

## Build and run

```bash
pnpm build
pnpm start
```

`pnpm build` compiles TypeScript into `dist/`. `pnpm start` runs **`dist/app/start.js`**, which registers path aliases before loading the server. The [Dockerfile](Dockerfile) uses Node 24, builds the application, and starts the same compiled entry point.

## Tests and validation

Backend Jest tests live in **`__tests__/unit/`** and **`__tests__/integration/`**. Jest currently discovers **`__tests__/**/*.test.ts`**; Prisma-specific tests have their own command.

```bash
# General backend Jest suite
pnpm test

# A targeted test file
pnpm test -- __tests__/unit/authentication.test.ts

# Prisma-specific tests (requires a compatible local MongoDB replica set)
pnpm test:prisma

# Static checks and production compilation
pnpm lint
pnpm type-check
pnpm format:check
pnpm prisma:validate
pnpm check:contract
pnpm build
```

`pnpm check:contract` validates frontend GraphQL documents against the backend's executable schema and resolver coverage. The GitHub Actions workflow runs linting, type checks, tests with coverage, the GraphQL contract check, production builds, and a conditional Docker smoke test.

**End-to-end browser tests** live in `quotevote-frontend/e2e/` and use Playwright. The CI E2E job is currently gated by credentials and can show a successful job **with browser tests skipped**. Check the job steps and executed-test counts before treating E2E coverage as a release gate. See [#85](https://github.com/QuoteVote/quotevote-next/issues/85) and [#108](https://github.com/QuoteVote/quotevote-next/issues/108).

### Useful package scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start `tsx watch app/server.ts` |
| `pnpm build` / `pnpm start` | Compile and run the production entry point |
| `pnpm test` / `pnpm test:prisma` | Run Jest or Prisma-specific tests |
| `pnpm lint` / `pnpm lint:fix` | Check or fix ESLint findings |
| `pnpm type-check` | TypeScript check without emitting files |
| `pnpm format` / `pnpm format:check` | Apply or verify Prettier formatting |
| `pnpm check:contract` | Verify frontend GraphQL documents against backend |
| `pnpm prisma:generate` / `pnpm prisma:validate` | Generate Prisma Client or validate schema |
| `pnpm prisma:health` / `pnpm prisma:test` | Local Prisma connectivity and CRUD checks |
| `pnpm roster:audit` | Read-only legacy relationship audit |
| `pnpm roster:backfill` | Legacy Roster-to-Prisma backfill; defaults to dry run |

See the actual [scripts in package.json](package.json) for the complete list and command behavior.

## Database migration safety

The Prisma models in `prisma/schema/` deliberately map to existing MongoDB collections and fields so historical accounts, content, and relationships remain compatible during the 2.0 cutover.

- The new backend currently operates alongside some Mongoose code. **#169** tracks its final removal.
- Use **isolated databases** for local migration tests, seed scripts, and experiments.
- **Do not run `pnpm prisma:push`, `pnpm prisma:sync`, or `prisma db push` against a shared staging or production database.** These commands can change indexes on existing collections. Follow the reviewed index and cutover process instead ([#694](https://github.com/QuoteVote/quotevote-next/issues/694)).
- The Roster-to-Buddy/UserBlock backfill supports a dry run; `--apply` writes data and requires deliberate coordination.
- Staging must use a **separate database restored from a recent production backup**, followed by documented data checks and smoke tests ([#182](https://github.com/QuoteVote/quotevote-next/issues/182), [#183](https://github.com/QuoteVote/quotevote-next/issues/183)).
- **Solid remains under integration:** the current staging code still contains legacy Solid/Mongoose paths and an incomplete authorization callback. PR [#571](https://github.com/QuoteVote/quotevote-next/pull/571) proposes the Prisma-backed Solid-OIDC implementation and member experience. Its end-to-end provider interoperability must be verified before release.

## Security and operations

- Provide **`JWT_SECRET`** in every deployed environment; the development fallback is intentionally unsuitable for production.
- Restrict **`CLIENT_URL`** to the expected frontend origin, configure **`TRUST_PROXY`** only for your deployment topology, and keep database/email/Solid credentials in environment secrets.
- Review authentication, authorization, rate limits, subscriptions, moderation, and deployment behavior under [#107](https://github.com/QuoteVote/quotevote-next/issues/107).
- Error tracking, production rollback, and monitoring are tracked under [#183](https://github.com/QuoteVote/quotevote-next/issues/183). Their proposed changes must be merged and configured before relying on them operationally.
- Preserve current application behavior during the migration; avoid exposing messages, tokens, user information, or other sensitive data in logs and issue reports.

## Contributing and references

Read the repository [contribution guide](../CONTRIBUTING.md) before taking on an issue or submitting a pull request. Coordinate 2.0 changes against `staging`, especially when the frontend depends on the new GraphQL contract. Include tests for changed behavior and follow the issue's acceptance criteria.

- [2.0 release roadmap — #637](https://github.com/QuoteVote/quotevote-next/issues/637)
- [Mongoose removal — #169](https://github.com/QuoteVote/quotevote-next/issues/169)
- [Backend documentation — #175](https://github.com/QuoteVote/quotevote-next/issues/175)
- [Migration rules](../docs/Migration-Rules.md)
- [Backend testing guide](../docs/backend/testing_guide.md)
- [Express](https://expressjs.com/), [Apollo Server](https://www.apollographql.com/docs/apollo-server/), [Prisma](https://www.prisma.io/docs/), [Jest](https://jestjs.io/)

**License:** This repository is distributed under [GNU AGPL-3.0](../LICENSE). The backend `package.json` currently declares `"license": "ISC"`; that manifest metadata conflicts with the repository license and should be reconciled separately. This README update does not change licensing terms or package metadata.
