import { toIsoDateString } from '~/data/utils/serializeDate';

describe('toIsoDateString', () => {
  it('serializes Date instances to ISO strings', () => {
    expect(toIsoDateString(new Date('2024-01-15T12:00:00.000Z'))).toBe(
      '2024-01-15T12:00:00.000Z'
    );
  });

  it('serializes millisecond epoch numbers to ISO strings', () => {
    const ms = Date.UTC(2024, 0, 15);
    expect(toIsoDateString(ms)).toBe(new Date(ms).toISOString());
  });

  it('treats small epoch numbers as seconds', () => {
    expect(toIsoDateString(1705276800)).toBe('2024-01-15T00:00:00.000Z');
  });

  it('serializes numeric timestamp strings', () => {
    const ms = Date.UTC(2024, 0, 15);
    expect(toIsoDateString(String(ms))).toBe(new Date(ms).toISOString());
  });

  it('returns empty string for invalid values', () => {
    expect(toIsoDateString(null)).toBe('');
    expect(toIsoDateString(undefined)).toBe('');
    expect(toIsoDateString('not-a-date')).toBe('');
    expect(toIsoDateString(new Date('invalid'))).toBe('');
  });
});
