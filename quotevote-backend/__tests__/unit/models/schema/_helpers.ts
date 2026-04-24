import mongoose from 'mongoose';

/**
 * Shared test helpers for schema validation tests.
 */

/** Create a new ObjectId for test data */
export function createObjectId(): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId();
}

/** Run validateSync() and return the errors map (or undefined if valid) */
export function getValidationErrors(doc: mongoose.Document) {
  const err = doc.validateSync();
  return err?.errors;
}

/** Safely close mongoose connection if open */
export async function closeConnection(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}
