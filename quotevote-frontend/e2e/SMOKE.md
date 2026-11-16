# Staging smoke test (#182)

`e2e/smoke.spec.ts` walks through the core of the product once, on production builds of the new backend and the frontend:

1. two members sign in
2. password reset from the email link, then sign in with the new password
3. create a post
4. vote on a passage
5. comment in the discussion
6. quote a passage
7. follow the author
8. direct message the author (marked `fixme` until #713 is fixed)
9. the author's notifications show the vote and the follow
10. a new comment reaches the author's open post over WebSocket, without a reload
11. the API it ran against is local

Each run creates two new members with `pnpm seed:e2e-user`. That means it repeats on the same database with no cleanup, and you can run it twice in a row. It skips itself unless the API is on localhost and the SendGrid mock is set, because it writes accounts and posts and reads the reset email from the mock. Never point it at a shared or production database.

## What you need

- A local MongoDB replica set, for example `mongodb://127.0.0.1:27018/quotevote_local?replicaSet=rs0&directConnection=true`. A copy of data written by the current API is best, since that is what the new backend will run on.
- The tag named in `E2E_PUBLIC_TAG_NAME` (default `QA`) in that database.
- `quotevote-frontend/.env.e2e.local` with the author account (`E2E_AUTHOR_USERNAME`, `E2E_AUTHOR_PASSWORD`). Create the account with `pnpm seed:e2e-author` in `quotevote-backend`.

## 1. SendGrid mock

From `quotevote-backend`:

```bash
pnpm sendgrid:mock   # listens on 127.0.0.1:4010
```

## 2. Backend, from its Docker image

From `quotevote-backend`:

```bash
docker build -t qv-backend:smoke .

DB='mongodb://host.docker.internal:27018/quotevote_local?replicaSet=rs0&directConnection=true'
docker run -d --name qv-smoke-backend -p 4006:4000 \
  --add-host host.docker.internal:host-gateway \
  -e NODE_ENV=development \
  -e JWT_SECRET='<any local secret>' \
  -e DATABASE_URL="$DB" -e MONGO_URI="$DB" -e MONGODB_URI="$DB" \
  -e CLIENT_URL=http://localhost:3003 \
  -e SENDGRID_API_KEY=SG.e2e-mock \
  -e SENDGRID_SENDER_EMAIL=noreply@quotevote.local \
  -e SENDGRID_MOCK_BASE_URL=http://host.docker.internal:4010 \
  qv-backend:smoke

curl http://localhost:4006/health   # {"status":"ok"}
```

`NODE_ENV=development` is needed only because the backend ignores `SENDGRID_MOCK_BASE_URL` when `NODE_ENV=production`, and the password reset step reads its email from the mock. Everything else is the production image.

## 3. Frontend, as a production build

From `quotevote-frontend`, with the same `JWT_SECRET` as the backend:

```bash
NEXT_PUBLIC_SERVER_URL=http://localhost:4006 \
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4006/graphql \
pnpm build

JWT_SECRET='<same local secret>' pnpm start -p 3003
```

`NEXT_PUBLIC_*` values are baked in at build time, so rebuild when the API address changes.

## 4. Run it

From `quotevote-frontend`:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3003 \
PLAYWRIGHT_SKIP_WEBSERVER=1 \
E2E_API_URL=http://localhost:4006 \
E2E_GRAPHQL_ENDPOINT=http://localhost:4006/graphql \
E2E_SENDGRID_MOCK_URL=http://127.0.0.1:4010 \
DATABASE_URL='mongodb://127.0.0.1:27018/quotevote_local?replicaSet=rs0&directConnection=true' \
pnpm test:e2e smoke.spec.ts --project=desktop
```

`DATABASE_URL` is used by `pnpm seed:e2e-user` to create the two members. A clean run ends with `10 passed, 1 skipped` (the direct message step) and takes under 15 seconds.

## When it fails

Playwright keeps a screenshot and trace for each failed step in `test-results/`. The steps share two signed-in members and one post, so after the first failure the rest don't run. Fix that step and run it again.
