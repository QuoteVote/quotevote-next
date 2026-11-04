import {
  ATTRIBUTION_MAX_LENGTH,
  containsUrl,
  sanitizeUrl,
  validateAddPostContent,
} from '~/data/resolvers/utils/postInput';

describe('sanitizeUrl', () => {
  it('accepts http and https URLs and returns a normalized href', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('  http://example.com/path  ')).toBe('http://example.com/path');
  });

  it('rejects javascript: and data: protocols', () => {
    expect(sanitizeUrl('javascript:alert(document.cookie)')).toBeNull();
    expect(sanitizeUrl('data:text/html,hi')).toBeNull();
  });

  it('rejects URLs that contain emoji', () => {
    expect(sanitizeUrl('https://example.com/😀')).toBeNull();
  });
});

describe('containsUrl', () => {
  it('detects links in post body text', () => {
    expect(containsUrl('See https://evil.example for more')).toBe(true);
    expect(containsUrl('No links here')).toBe(false);
  });
});

describe('validateAddPostContent', () => {
  it('returns trimmed text and a sanitized citation', () => {
    expect(
      validateAddPostContent({
        text: '  Hello world  ',
        citationUrl: 'https://example.com/source',
        attribution: '  Author  ',
      })
    ).toEqual({
      text: 'Hello world',
      citationUrl: 'https://example.com/source',
      attribution: 'Author',
    });
  });

  it('rejects javascript: citations', () => {
    expect(() =>
      validateAddPostContent({
        text: 'Body',
        citationUrl: 'javascript:alert(document.cookie)',
      })
    ).toThrow(/Invalid citation URL/);
  });

  it('rejects data: citations', () => {
    expect(() =>
      validateAddPostContent({
        text: 'Body',
        citationUrl: 'data:text/html,hi',
      })
    ).toThrow(/Invalid citation URL/);
  });

  it('rejects emoji in the citation URL', () => {
    expect(() =>
      validateAddPostContent({
        text: 'Body',
        citationUrl: 'https://example.com/🔥',
      })
    ).toThrow(/Invalid citation URL/);
  });

  it('rejects a link in the body', () => {
    expect(() =>
      validateAddPostContent({
        text: 'Check https://evil.example please',
      })
    ).toThrow(/Post body cannot contain links/);
  });

  it('rejects attribution longer than 120 characters', () => {
    expect(() =>
      validateAddPostContent({
        text: 'Body',
        attribution: 'a'.repeat(ATTRIBUTION_MAX_LENGTH + 1),
      })
    ).toThrow(/Attribution should be less than 120 characters/);
  });
});
