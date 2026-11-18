/** One index a Mongoose model declares, normalized for comparison (#716). */
export interface DeclaredIndex {
  collection: string;
  /** The key as declared, e.g. `{ postId: 1, userId: 1 }` or `{ title: 'text' }`. */
  fields: Record<string, 1 | -1 | 'text'>;
  unique: boolean;
  sparse: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, unknown>;
  /** Only when the model names the index. */
  name?: string;
}

/** An index as `listIndexes` returns it. */
export interface ExistingIndex {
  name: string;
  key: Record<string, unknown>;
  unique?: boolean;
  sparse?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, unknown>;
  weights?: Record<string, number>;
}

export interface IndexConflict {
  declared: DeclaredIndex;
  existing?: ExistingIndex;
  reason: string;
}

/** What it takes to bring a database to the indexes the models declare. */
export interface IndexPlan {
  /** Declared and missing: built with `--apply`. */
  missing: DeclaredIndex[];
  /** Present without the TTL the model declares: turned into a TTL index with collMod. */
  ttl: DeclaredIndex[];
  /** Same key, different options, or declared twice: reported, never changed. */
  conflicts: IndexConflict[];
  /** Already there as declared. */
  present: number;
}

/** A model's collection and `schema.indexes()`, as Mongoose returns them. */
export interface ModelIndexSource {
  collection: string;
  indexes: [Record<string, unknown>, Record<string, unknown>][];
}
