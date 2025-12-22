import { useMutation, useQuery } from '@apollo/client/react';

describe('Apollo Client Hooks', () => {
  it('should export useQuery as a function', () => {
    expect(typeof useQuery).toBe('function');
  });

  it('should export useMutation as a function', () => {
    expect(typeof useMutation).toBe('function');
  });
});