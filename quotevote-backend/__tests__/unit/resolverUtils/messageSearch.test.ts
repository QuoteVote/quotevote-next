import {
  buildSnippet,
  encodeSearchCursor,
  parseSearchCursor,
} from '~/data/resolvers/utils/messageSearch';

describe('buildSnippet', () => {
  it('finds regex characters literally', () => {
    expect(buildSnippet('cost is (5.*) dollars', '(5.*)')).toBe('cost is (5.*) dollars');
  });

  it('returns a short message whole, keeping its original case', () => {
    expect(buildSnippet('Meet at the TOWN HALL', 'town hall')).toBe('Meet at the TOWN HALL');
  });

  it('cuts around the match with an ellipsis on both sides', () => {
    const text = `${'a'.repeat(100)} needle ${'b'.repeat(100)}`;
    const snippet = buildSnippet(text, 'needle');

    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet).toContain('needle');
    expect(snippet.length).toBeLessThanOrEqual(2 * 60 + 'needle'.length + 2);
  });

  it('puts the excerpt on a single line', () => {
    expect(buildSnippet('line one\n\nline   two', 'two')).toBe('line one line two');
  });

  it('truncates when the match is not found', () => {
    const snippet = buildSnippet('x'.repeat(300), 'zzz');

    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet).toHaveLength(121);
  });
});

describe('search cursor', () => {
  it('round-trips created and id', () => {
    const created = new Date('2026-01-01T00:00:00.000Z');
    const id = '507f1f77bcf86cd7994390a1';

    expect(parseSearchCursor(encodeSearchCursor(created, id))).toEqual({ created, id });
  });

  it.each(['nope', '123_xyz', '_507f1f77bcf86cd7994390a1', '1700000000000_'])(
    'rejects the malformed cursor %s',
    (value) => {
      expect(parseSearchCursor(value)).toBeNull();
    }
  );
});
