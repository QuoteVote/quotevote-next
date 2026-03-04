/**
 * Common Resolver Utilities
 * Generic helper functions used across resolvers
 */

/**
 * Remove duplicate elements from an array using strict equality.
 * For arrays of primitives or objects where reference equality is sufficient.
 */
export const uniqueArrayObjects = <T>(arr: T[]): T[] => {
  return arr.filter((elem, pos, self) => self.indexOf(elem) === pos);
};
