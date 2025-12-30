import { add, multiply } from '~/data/utils/sample';

describe('Sample Utils', () => {
  describe('add', () => {
    it('should add two numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers', () => {
      expect(multiply(4, 5)).toBe(20);
    });
  });
});
