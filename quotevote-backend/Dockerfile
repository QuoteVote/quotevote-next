# Backend image for staging and production (#182).
# Build from this folder: docker build -t quotevote-backend .

FROM node:24-bookworm-slim AS base
# Prisma's query engine needs OpenSSL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# Same pnpm major as CI.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
# postinstall runs `prisma generate`.
RUN pnpm install --frozen-lockfile --ignore-workspace
COPY tsconfig.json ./
COPY app ./app
RUN pnpm build
# Keep the generated Prisma client, drop dev dependencies.
RUN pnpm prune --prod --ignore-scripts

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
# node as PID 1 receives SIGTERM directly, so the server can shut down cleanly.
CMD ["node", "dist/app/start.js"]
