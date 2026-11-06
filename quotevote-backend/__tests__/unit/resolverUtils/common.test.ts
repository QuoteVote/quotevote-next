/**
 * Test suite for common resolver utilities.
 */

import { uniqueArrayObjects, isObjectId, escapeRegExp } from '~/data/resolvers/utils/common';

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

  describe('isObjectId', () => {
    it('returns true for valid 24-character hex strings', () => {
      expect(isObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isObjectId('000000000000000000000000')).toBe(true);
    });

    it('returns false for invalid ObjectId strings', () => {
      expect(isObjectId('')).toBe(false);
      expect(isObjectId('invalid')).toBe(false);
      expect(isObjectId('507f1f77bcf86cd79943901')).toBe(false); // 23 chars
      expect(isObjectId('507f1f77bcf86cd7994390111')).toBe(false); // 25 chars
      expect(isObjectId('507f1f77bcf86cd79943901z')).toBe(false); // non-hex
    });
  });

  describe('escapeRegExp', () => {
    it('escapes every regex metacharacter', () => {
      expect(escapeRegExp('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('leaves plain text unchanged', () => {
      expect(escapeRegExp('town hall')).toBe('town hall');
    });

    it('builds a pattern that only matches the literal text', () => {
      const pattern = new RegExp(escapeRegExp('a.*b'));

      expect(pattern.test('a.*b')).toBe(true);
      expect(pattern.test('axxb')).toBe(false);
    });
  });
});
