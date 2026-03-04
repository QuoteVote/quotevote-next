/**
 * Test suite for common resolver utilities.
 */

import { uniqueArrayObjects } from '~/data/resolvers/utils/common';

describe('common resolver utilities', () => {
  describe('uniqueArrayObjects', () => {
    it('should remove duplicate primitives', () => {
      expect(uniqueArrayObjects([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('should remove duplicate strings', () => {
      expect(uniqueArrayObjects(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should return empty array for empty input', () => {
      expect(uniqueArrayObjects([])).toEqual([]);
    });

    it('should return same array when all elements are unique', () => {
      expect(uniqueArrayObjects([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should preserve reference equality for objects (only removes same-reference duplicates)', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      // Same reference pushed twice
      expect(uniqueArrayObjects([obj1, obj2, obj1])).toEqual([obj1, obj2]);
    });

    it('should not remove objects with same shape but different references', () => {
      const a = { id: 1 };
      const b = { id: 1 };
      // Different references, same shape — strict equality means both kept
      expect(uniqueArrayObjects([a, b])).toEqual([a, b]);
    });

    it('should handle single-element array', () => {
      expect(uniqueArrayObjects([42])).toEqual([42]);
    });
  });
});
