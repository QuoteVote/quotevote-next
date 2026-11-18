/**
 * Types for the read-only data check (`pnpm data:check`, #183).
 */

/** Runs one MongoDB database command, e.g. `prisma.$runCommandRaw`. */
export type RunCommand = (command: Record<string, unknown>) => Promise<unknown>;

/**
 * What is wrong with a field, in terms of how the Prisma client reads it. Except for
 * `default-filled`, a read fails only when it includes the field, so a resolver that selects
 * other fields still works. These are the fields a full-record read or a new `select` trips on.
 * - `missing-required`: a required field with no static default (none, `now()` or
 *   `@updatedAt`) is missing or null.
 * - `default-filled`: a required field with a static default is missing or null. Reads return
 *   the default, but `where` filters on the field don't match the record.
 * - `wrong-type`: the stored value can't be converted to the field's type.
 * - `unknown-enum`: the stored value isn't one of the enum's values.
 * - `not-a-list`: a list field holds something other than an array.
 * - `wrong-list-element`: a list holds an element of the wrong type.
 */
export type FieldProblem =
  | 'missing-required'
  | 'default-filled'
  | 'wrong-type'
  | 'unknown-enum'
  | 'not-a-list'
  | 'wrong-list-element';

/** One query that finds records with a given problem in one field. */
export interface ShapeCheck {
  collection: string;
  model: string;
  field: string;
  problem: FieldProblem;
  filter: Record<string, unknown>;
}

/** The parts of a Prisma DMMF field the checks are built from. */
export interface DataCheckField {
  name: string;
  dbName?: string | null;
  kind: string;
  type: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  isUpdatedAt?: boolean;
  hasDefaultValue: boolean;
  default?: unknown;
}

export interface DataCheckModel {
  name: string;
  dbName?: string | null;
  fields: DataCheckField[];
}

export interface DataCheckEnum {
  name: string;
  values: Array<{ name: string; dbName?: string | null }>;
}

/** An index as `listIndexes` reports it, without the server-specific `v` and `ns`. */
export interface IndexSummary {
  name: string;
  key: Record<string, unknown>;
  unique?: boolean;
  sparse?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, unknown>;
}

export interface FieldIssue {
  model: string;
  field: string;
  problem: FieldProblem;
  count: number;
}

export interface CollectionReport {
  count: number;
  indexes: IndexSummary[];
  /** Only problems that at least one record has. */
  issues: FieldIssue[];
}

export interface DataCheckReport {
  tool: 'data-check';
  version: 1;
  database: string;
  generatedAt: string;
  /** The records #183 asks to be checked, by name. Collections that don't exist count 0. */
  records: Record<string, number>;
  /** Every collection in the database, Prisma-mapped or not. */
  collections: Record<string, CollectionReport>;
  /** Prisma-mapped collections that don't exist in the database. */
  missingCollections: string[];
}

export interface CompareOptions {
  indexesOnly?: boolean;
}
