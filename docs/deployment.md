# Deploying Quote.Vote 2.0

Part of #175. This covers how the new backend (`quotevote-backend`) and the frontend (`quotevote-frontend`) are built, configured, deployed and rolled back. It links to the guides that already cover single steps instead of repeating them.

Three parts run together:

- **MongoDB**, as a replica set. Prisma needs transactions, and MongoDB only allows them on a replica set. A single-node replica set works.
- **The backend**, a container built from `quotevote-backend/Dockerfile`.
- **The frontend**, a Next.js build that talks to the backend over HTTP and WebSocket.

## Backend

### Build

From `quotevote-backend`:

```bash
docker build -t quotevote-backend .
```

The image installs with the same pnpm major as CI, generates the Prisma client, compiles TypeScript to `dist/`, and keeps only production dependencies. It runs `node dist/app/start.js` as the `node` user, on port 4000 by default.

Without Docker, the same steps are `pnpm install --frozen-lockfile`, `pnpm build` and `pnpm start`.

### Environment

The backend reads these settings. The first three are required.

| Variable | What it does |
|---|---|
| `DATABASE_URL` | The database, for Prisma. Must point at a replica set (`?replicaSet=...`). |
| `MONGO_URI` | The same database, for the older Mongoose models. Use the same value as `DATABASE_URL`. |
| `JWT_SECRET` | Signs sign-in tokens. The frontend needs the same value (see below). Without it, sign-in is insecure and the server logs an error. |
| `NODE_ENV` | `production` in the image. Production never builds indexes when the server starts (#730); they're built on purpose with the steps below. |
| `PORT` | Port to listen on. Defaults to 4000. |
| `CLIENT_URL` | The frontend's address, such as `https://example.org`. It's the only origin CORS allows, and links in emails (invite approval, password reset) point at it. |
| `TRUST_PROXY` | Set when the backend runs behind the hosting platform's proxy, usually `1`, so rate limits see each visitor's address instead of the proxy's. |
| `SENDGRID_API_KEY`, `SENDGRID_SENDER_EMAIL` | Sending email: invites, invite approvals, password resets. |
| `TO_INVESTOR_EMAIL` | Where the investor contact form is sent. Optional. |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE` | Error tracking, off unless `SENTRY_DSN` is set. See [error-tracking.md](backend/error-tracking.md). |
| `LOG_LEVEL` | Defaults to `info`. |
| `SOLID_TOKEN_ENCRYPTION_KEY`, `SOLID_CLIENT_ID`, `SOLID_REDIRECT_URI_BASE`, `SOLID_ACTIVITY_LEDGER_ENABLED` | Solid Pods, only if they're turned on. See `quotevote-backend/app/solid/README.md`. |

`SENDGRID_MOCK_BASE_URL` is for local tests only, and the backend ignores it when `NODE_ENV` is `production`.

### Run and check

- **Health:** `GET /health` answers `{"status":"ok"}` once the server is listening. The image's Docker health check calls it, and the hosting platform's health check can too.
- **Shutdown:** the server stops cleanly on `SIGTERM`, so a redeploy doesn't cut requests off midway.
- **GraphQL:** served at `/graphql`, with subscriptions over WebSocket on the same path.

## Frontend

### Build

From `quotevote-frontend`, with the settings below in the build environment:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

`NEXT_PUBLIC_` values are written into the build, so rebuild whenever one of them changes.

### Environment

| Variable | When | What it does |
|---|---|---|
| `NEXT_PUBLIC_SERVER_URL` | build | The backend's address, such as `https://api.example.org`. GraphQL is at `/graphql` on it. |
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT` | build | The full GraphQL address, if it isn't `/graphql` on the server address. |
| `NEXT_PUBLIC_SITE_URL` | build | The site's own address, for page metadata and links. |
| `JWT_SECRET` | runtime | The same value as the backend's. The frontend uses it to check sign-in tokens before showing pages that need a member. |
| `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | build | Error tracking, off unless set. See [error-tracking.md](backend/error-tracking.md). |

One of `NEXT_PUBLIC_SERVER_URL` or `NEXT_PUBLIC_GRAPHQL_ENDPOINT` is required, and there is deliberately no default (#688). A build without one stops with an error instead of talking to another deployment's API. Every request the app makes uses this one address: GraphQL over HTTP and WebSocket, sign-in, and page metadata.

## A new instance

A new deployment with its own empty database is set up once, inside the deployed backend, with `node dist/app/setup.js`:

1. **Indexes:** `node dist/app/setup.js indexes --apply`
2. **First administrator:** `node dist/app/setup.js admin`
3. **Starting content, if any:** `node dist/app/setup.js demo <file.json>`

Each step is safe to run twice. See [instance-setup.md](backend/instance-setup.md).

## Switching from the current API

The new backend runs against the database the current (legacy) API has been writing to, with no copy or conversion. The checks below run on a staging copy first, then on the live database at a quiet time. They're listed with more detail in [rollback.md](backend/rollback.md#before-the-switch):

1. **Data check:** `pnpm data:check`, kept as the baseline. See [data-checks.md](backend/data-checks.md).
2. **Rooms with an empty member:** `pnpm rooms:audit`.
3. **Model indexes:** `pnpm db:model-indexes`, then `--apply`. See [model-indexes.md](backend/model-indexes.md).
4. **Unique indexes:** `pnpm db:unique-indexes`, then `--apply`.

Then:

5. Deploy the backend with the live database settings, and wait for `/health`.
6. Build the frontend against the new backend's address and deploy it.
7. Run the smoke test steps on the live site: sign in, the home feed, a post with its discussion, voting, a profile, messages and notifications. The automated version is in `quotevote-frontend/e2e/SMOKE.md`.
8. Watch error tracking and the backend logs.

Nothing in the switch runs `prisma db push`. It would change the indexes the current API relies on.

## Rolling back

Rolling back means going back to the current API. The steps are in [rollback.md](backend/rollback.md): promote the last frontend build that talks to the legacy API, stop the new backend, and copy buddies and blocks back to the rosters with `pnpm roster:rollback`. No database restore is needed.

## Before each deploy

- CI is green on the commit being deployed: lint, type-check, the frontend contract check, unit tests, the Prisma integration tests on a replica set, the container build with its health check, and the frontend build.
- A backend change that adds an index has its switch step (`pnpm db:model-indexes` or `pnpm db:unique-indexes`) run on the target database before or right after the deploy, since production doesn't build indexes when it starts.
