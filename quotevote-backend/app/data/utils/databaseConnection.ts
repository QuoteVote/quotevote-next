import type { ConnectOptions } from 'mongoose';

/**
 * Mongoose connection options (#716). In production, starting the backend never builds
 * indexes or creates collections: Mongoose's default `autoIndex` would build every
 * model's missing indexes on the live database the moment the backend connects.
 * `pnpm db:model-indexes` builds them on purpose instead. Development and tests keep
 * the defaults.
 */
export function mongooseConnectOptions(nodeEnv: string | undefined): ConnectOptions {
  return buildsIndexesAtStartup(nodeEnv) ? {} : { autoIndex: false, autoCreate: false };
}

/**
 * Whether starting the backend may build indexes (#716): everywhere but production.
 * In production the switch steps build them on purpose (`pnpm db:model-indexes` and
 * `pnpm db:unique-indexes`).
 */
export function buildsIndexesAtStartup(nodeEnv: string | undefined): boolean {
  return nodeEnv !== 'production';
}
