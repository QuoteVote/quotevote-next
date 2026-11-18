/** Sends one database command and returns its reply, e.g. `prisma.$runCommandRaw`. */
export type UniqueIndexRunCommand = (command: Record<string, unknown>) => Promise<unknown>;

/** The parts of a Prisma DMMF model the unique index check reads. */
export interface UniqueIndexModel {
  name: string;
  dbName: string | null;
  fields: readonly { name: string; dbName?: string | null; isUnique: boolean }[];
  uniqueIndexes: readonly { name: string | null; fields: readonly string[] }[];
}

/** A unique index the Prisma schema declares, in database names. */
export interface UniqueIndexSpec {
  model: string;
  collection: string;
  /** The name Prisma gives the index, used only when this check creates it. */
  name: string;
  /** Stored field names, in index order. */
  fields: string[];
}

/**
 * - `present`: an index with the same keys is already unique, whatever its name.
 * - `missing`: not there and safe to create; a dry run stops here.
 * - `created`: created by this run.
 * - `duplicates`: existing records share a key, so the index wasn't created.
 * - `conflict`: an index with the same keys or name exists in another form; left alone.
 * - `failed`: the database refused the command for another reason.
 */
export type UniqueIndexStatus =
  'present' | 'missing' | 'created' | 'duplicates' | 'conflict' | 'failed';

export interface UniqueIndexDuplicates {
  /** Number of key values held by more than one record. */
  groups: number;
  /** A few of those values with their record counts, so they can be resolved. */
  examples: { key: Record<string, unknown>; count: number }[];
}

export interface UniqueIndexResult extends UniqueIndexSpec {
  status: UniqueIndexStatus;
  /** The existing index that satisfies or conflicts with this one. */
  existingName?: string;
  duplicates?: UniqueIndexDuplicates;
  detail?: string;
}

export interface EnsureUniqueIndexesOptions {
  run: UniqueIndexRunCommand;
  models: readonly UniqueIndexModel[];
  /** Report what would be created without creating anything. */
  dryRun?: boolean;
}
