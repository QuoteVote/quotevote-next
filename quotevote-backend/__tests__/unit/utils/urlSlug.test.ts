import { slugify } from '~/data/utils/urlSlug';

describe('slugify', () => {
  it('keeps the legacy shape for plain titles', () => {
    expect(slugify('Hello World', 'post')).toBe('hello-world');
    expect(slugify('Review 666 Tag', 'tag')).toBe('review-666-tag');
  });

  it('drops characters that would break a link', () => {
    expect(slugify('Should transit be free for students?', 'post')).toBe(
      'should-transit-be-free-for-students'
    );
    expect(slugify('Rent #2 / utilities & fees', 'post')).toBe('rent-2-utilities-fees');
    expect(slugify('50% off?!', 'post')).toBe('50-off');
  });

  it('joins runs of spaces and punctuation into one dash and trims the ends', () => {
    expect(slugify('  "Quoted"  -- title...  ', 'post')).toBe('quoted-title');
  });

  it('keeps letters outside ASCII', () => {
    expect(slugify('¿Qué opinas?', 'post')).toBe('qué-opinas');
    expect(slugify('Ｆｕｌｌ Width', 'post')).toBe('full-width');
  });

  it('falls back when nothing usable is left', () => {
    expect(slugify('???', 'post')).toBe('post');
    expect(slugify('', 'tag')).toBe('tag');
  });
});
