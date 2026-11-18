# Error tracking

Part of #183. The backend and the frontend report unexpected errors to Sentry when a DSN is set. With no DSN, nothing is sent and nothing changes, so local runs, tests and CI need no setup.

## Settings

| Package | Variable | Purpose |
| --- | --- | --- |
| backend | `SENTRY_DSN` | Turns reporting on. |
| backend | `SENTRY_ENVIRONMENT` | Environment name on reports, such as `staging`. Defaults to `NODE_ENV`. |
| backend | `SENTRY_RELEASE` | Optional release name, such as the commit SHA. |
| frontend | `NEXT_PUBLIC_SENTRY_DSN` | Turns reporting on. Read at build time, like the other `NEXT_PUBLIC_` values. |
| frontend | `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Environment name on reports. Defaults to `NODE_ENV`. |

Staging and production should use different environment names, so their errors stay apart.

## What is reported

**Backend** (`app/lib/errorTracking.ts`, loaded first through `app/instrument.ts`):

- GraphQL errors over HTTP and WebSocket that come from a crash: anything a resolver threw that wasn't a `GraphQLError`, and anything marked `INTERNAL_SERVER_ERROR`.
- Errors from the REST routes (`/auth/*`) with a 5xx status, or with no status.
- Uncaught exceptions and unhandled promise rejections, through the SDK's own handlers.

Answers to the client aren't reported: `BAD_USER_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `TOO_MANY_REQUESTS`, validation and parse failures, a `GraphQLError` thrown on purpose, and 4xx errors such as a malformed JSON body.

Each report is tagged with its source (`graphql`, `subscription` or `http`), the operation name, the field path and the route.

**Frontend** (`src/lib/errorTracking/`, started by `src/instrumentation-client.ts`):

- Uncaught errors and unhandled promise rejections in the browser.
- Errors caught by `ErrorBoundary` and by the dashboard error page, with the Next.js digest when there is one.

The browser sends reports to `/monitoring` on the frontend's own origin, which forwards them to Sentry (`src/lib/errorTracking/tunnel.ts`). The content security policy therefore needs no new host, ad blockers don't drop the reports, and Sentry sees the server's address instead of the visitor's. The route only forwards envelopes addressed to the configured project, refuses anything over 256 KB, and answers 404 when no DSN is set.

## What is never sent

Sentry collects several of these by default. They're all turned off in `dataCollection`, and the `beforeSend` and `beforeBreadcrumb` hooks remove what's left:

- the signed-in user, cookies, request headers (except the browser's user agent), request bodies and query strings
- GraphQL documents and variables, so no post, comment or message text, and no passwords
- database query data and local variable values
- the arguments in Prisma's error messages ("Invalid `prisma.user.findUnique()` invocation: ... where: { email: ... }"), so only the first line and the reason are kept
- console output, and click and input breadcrumbs, whose selectors can include names from labels

Performance tracing and session counts are off. Only errors are sent.

## Checking it locally

Set the DSN to a local listener, for example `http://key@localhost:4011/1`, with a small HTTP server on port 4011 that records what it receives. A resolver crash on the backend, or `setTimeout(() => { throw new Error('check') })` in the browser console, then arrives as one envelope. The backend posts to `/api/<project>/envelope/` directly, and the browser's reports arrive through `/monitoring`.

## Not covered yet

Stack traces from the production frontend build are minified. Readable traces need the source maps uploaded to Sentry during the build, which needs a Sentry auth token in the build environment. That belongs with the staging deployment (#182).
