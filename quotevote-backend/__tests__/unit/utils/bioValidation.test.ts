import { normalizeBio, BIO_MAX_LENGTH } from '~/data/utils/bioValidation';

describe('bioValidation', () => {
  describe('normalizeBio', () => {
    it('trims whitespace', () => {
      expect(normalizeBio('  hello world  ')).toBe('hello world');
    });

    it('returns empty string for nullish or blank input', () => {
      expect(normalizeBio(null)).toBe('');
      expect(normalizeBio(undefined)).toBe('');
      expect(normalizeBio('   ')).toBe('');
    });

    it('accepts plain text within the max length', () => {
      const bio = 'a'.repeat(BIO_MAX_LENGTH);
      expect(normalizeBio(bio)).toBe(bio);
    });

    it('rejects text longer than the max length', () => {
      expect(() => normalizeBio('a'.repeat(BIO_MAX_LENGTH + 1))).toThrow(
        `About must be ${BIO_MAX_LENGTH} characters or fewer`
      );
    });

    it('rejects HTML markup', () => {
      expect(() => normalizeBio('Hello <script>alert(1)</script>')).toThrow(
        'About must be plain text without HTML'
      );
      expect(() => normalizeBio('<b>bold</b>')).toThrow('About must be plain text without HTML');
    });
  });
});
