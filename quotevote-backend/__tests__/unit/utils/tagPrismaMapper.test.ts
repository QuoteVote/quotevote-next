import {
  isObjectId,
  toCommonTag,
  TAG_RECORD_SELECT,
  type PrismaTagRecord,
} from '~/data/utils/tagPrismaMapper';

describe('tagPrismaMapper', () => {
  describe('isObjectId', () => {
    it('returns true for a valid 24-character hexadecimal ObjectId', () => {
      expect(isObjectId('507f1f77bcf86cd799439011')).toBe(true);
      expect(isObjectId('000000000000000000000000')).toBe(true);
      expect(isObjectId('abcdefABCDEF0123456789ab')).toBe(true);
    });

    it('returns false for invalid strings', () => {
      expect(isObjectId('')).toBe(false);
      expect(isObjectId('invalid')).toBe(false);
      expect(isObjectId('507f1f77bcf86cd79943901')).toBe(false); // 23 chars
      expect(isObjectId('507f1f77bcf86cd7994390111')).toBe(false); // 25 chars
      expect(isObjectId('507f1f77bcf86cd79943901z')).toBe(false); // 'z' not hex
    });
  });

  describe('TAG_RECORD_SELECT', () => {
    it('selects expected fields from Prisma Tag model', () => {
      expect(TAG_RECORD_SELECT).toEqual({
        id: true,
        creatorId: true,
        adminIds: true,
        allowedUserIds: true,
        privacy: true,
        title: true,
        url: true,
        description: true,
        created: true,
        createdAt: true,
        updatedAt: true,
      });
    });
  });

  describe('toCommonTag', () => {
    it('maps complete Prisma record to Common.Tag', () => {
      const created = new Date('2026-01-01T00:00:00Z');
      const updatedAt = new Date('2026-01-02T00:00:00Z');

      const record: PrismaTagRecord = {
        id: '507f1f77bcf86cd799439011',
        creatorId: '507f1f77bcf86cd799439012',
        adminIds: ['507f1f77bcf86cd799439013'],
        allowedUserIds: ['507f1f77bcf86cd799439014'],
        privacy: 'restricted',
        title: 'Technology',
        url: 'https://example.com/tech',
        description: 'Tech discussion group',
        created,
        createdAt: created,
        updatedAt,
      };

      const result = toCommonTag(record);

      expect(result).toEqual({
        _id: '507f1f77bcf86cd799439011',
        creatorId: '507f1f77bcf86cd799439012',
        adminIds: ['507f1f77bcf86cd799439013'],
        allowedUserIds: ['507f1f77bcf86cd799439014'],
        privacy: 'restricted',
        title: 'Technology',
        url: 'https://example.com/tech',
        description: 'Tech discussion group',
        created,
        updatedAt,
      });
    });

    it('accounts for legacy MongoDB document shapes with missing or null fields', () => {
      const createdAt = new Date('2026-01-01T00:00:00Z');

      const legacyRecord: PrismaTagRecord = {
        id: '507f1f77bcf86cd799439011',
        creatorId: '507f1f77bcf86cd799439012',
        title: 'Legacy Tag',
        adminIds: null,
        allowedUserIds: null,
        privacy: null,
        url: null,
        description: null,
        created: null,
        createdAt,
        updatedAt: null,
      };

      const result = toCommonTag(legacyRecord);

      expect(result._id).toBe('507f1f77bcf86cd799439011');
      expect(result.creatorId).toBe('507f1f77bcf86cd799439012');
      expect(result.title).toBe('Legacy Tag');
      expect(result.adminIds).toEqual([]);
      expect(result.allowedUserIds).toEqual([]);
      expect(result.privacy).toBe('public');
      expect(result.url).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.created).toEqual(createdAt);
      expect(result.updatedAt).toBeUndefined();
    });

    it('defaults created to current Date when neither created nor createdAt are provided', () => {
      const minimalRecord: PrismaTagRecord = {
        id: '507f1f77bcf86cd799439011',
        creatorId: '507f1f77bcf86cd799439012',
        title: 'Minimal Tag',
      };

      const result = toCommonTag(minimalRecord);

      expect(result._id).toBe('507f1f77bcf86cd799439011');
      expect(result.created).toBeInstanceOf(Date);
      expect(result.privacy).toBe('public');
      expect(result.adminIds).toEqual([]);
      expect(result.allowedUserIds).toEqual([]);
    });
  });
});
