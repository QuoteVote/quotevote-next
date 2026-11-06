/**
 * Common Resolver Utilities
 * Generic helper functions used across resolvers
 */

export const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

export function isObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

/**
 * Remove duplicate elements from an array using strict equality.
 * For arrays of primitives or objects where reference equality is sufficient.
 */
export const uniqueArrayObjects = <T>(arr: T[]): T[] => {
  return arr.filter((elem, pos, self) => self.indexOf(elem) === pos);
};

/**
 * Escape regex metacharacters. Prisma's `contains` on MongoDB passes the text
 * to `$regex` unescaped, so user-supplied search text must go through this.
 */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
