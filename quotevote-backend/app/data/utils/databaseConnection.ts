import type { ConnectOptions } from 'mongoose';

/**
 * Mongoose connection options (#716). Outside development and tests, starting the backend
 * never builds indexes or creates collections: Mongoose's default `autoIndex` would build
 * every model's missing indexes on the live database the moment the backend connects.
 * `pnpm db:model-indexes` builds them on purpose instead. Development and tests keep
 * the defaults.
 */
export function mongooseConnectOptions(nodeEnv: string | undefined): ConnectOptions {
  return buildsIndexesAtStartup(nodeEnv) ? {} : { autoIndex: false, autoCreate: false };
}

/** The environments where starting the backend builds indexes. */
const INDEX_BUILDING_ENVS = ['development', 'test'];

/**
 * Whether starting the backend may build indexes (#716): only in development and tests.
 * Any other value, including a missing or misspelled one such as `prod`, builds nothing,
 * so a live database is never changed by a deploy with the wrong setting (#747). Everywhere
 * else the switch steps build them on purpose (`pnpm db:model-indexes` and
 * `pnpm db:unique-indexes`).
 */
export function buildsIndexesAtStartup(nodeEnv: string | undefined): boolean {
  return INDEX_BUILDING_ENVS.includes(nodeEnv ?? '');
}
