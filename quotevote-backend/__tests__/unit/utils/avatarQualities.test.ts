import {
  AVATAR_QUALITY_KEYS,
  AVATAR_QUALITY_VALUES,
  validateAvatarQualities,
} from '~/data/utils/avatarQualities';

const valid = Object.fromEntries(
  AVATAR_QUALITY_KEYS.map((key) => [key, AVATAR_QUALITY_VALUES[key][0]])
);

describe('validateAvatarQualities (#705)', () => {
  it('knows the 13 Avataaars qualities and their values', () => {
    expect(AVATAR_QUALITY_KEYS).toHaveLength(13);
    expect(AVATAR_QUALITY_VALUES.topType).toHaveLength(35);
    expect(AVATAR_QUALITY_VALUES.topType).toContain('LongHairDreads');
    expect(AVATAR_QUALITY_VALUES.clotheColor).toHaveLength(15);
  });

  it('returns a fresh object with exactly the 13 keys', () => {
    const result = validateAvatarQualities(valid);
    expect(result).toEqual(valid);
    expect(result).not.toBe(valid);
  });

  it('rejects non-objects, missing keys, unknown keys and unknown values', () => {
    expect(() => validateAvatarQualities(null)).toThrow(/must be an object/);
    expect(() => validateAvatarQualities([])).toThrow(/must be an object/);
    expect(() => validateAvatarQualities('x')).toThrow(/must be an object/);
    const { topType: _drop, ...missing } = valid;
    void _drop;
    expect(() => validateAvatarQualities(missing)).toThrow(/topType is required/);
    expect(() => validateAvatarQualities({ ...valid, url: 'https://x.test' })).toThrow(
      /Unknown avatar quality: url/
    );
    expect(() => validateAvatarQualities({ ...valid, skinColor: 'Green' })).toThrow(
      /skinColor has an unsupported value/
    );
    expect(() => validateAvatarQualities({ ...valid, eyeType: 5 })).toThrow(/eyeType is required/);
  });

  it('keeps a very long unknown key out of the message', () => {
    const key = 'k'.repeat(500);
    expect(() => validateAvatarQualities({ ...valid, [key]: 'x' })).toThrow(
      new Error(`Unknown avatar quality: ${'k'.repeat(40)}`)
    );
  });
});
