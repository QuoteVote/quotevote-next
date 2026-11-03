import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import BotReport from '~/data/models/BotReport';
import UserReport from '~/data/models/UserReport';

// Mongoose sets `schema.aliases` at runtime but dropped it from its types in 9.x.
const aliasesOf = (schema: object): Record<string, string> | undefined =>
  (schema as { aliases?: Record<string, string> }).aliases;

describe('BotReport & UserReport Legacy Compatibility', () => {
  const schemaPath = path.resolve(__dirname, '../../../prisma/schema/social.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  describe('Prisma Schema Definitions', () => {
    it('should map BotReport fields to legacy MongoDB field names', () => {
      // Check that reporterId and userId map to legacy prefixed fields
      expect(schemaContent).toMatch(/reporterId\s+String\s+@map\("_reporterId"\)\s+@db\.ObjectId/);
      expect(schemaContent).toMatch(/userId\s+String\s+@map\("_reportedUserId"\)\s+@db\.ObjectId/);
    });

    it('should make BotReport created and updatedAt optional to prevent P2032 on legacy records', () => {
      expect(schemaContent).toMatch(/created\s+DateTime\?\s+@default\(now\(\)\)/);
      expect(schemaContent).toMatch(/createdAt\s+DateTime\?\s+@default\(now\(\)\)/);
      expect(schemaContent).toMatch(/updatedAt\s+DateTime\?\s+@updatedAt/);
    });

    it('should preserve exactly the legacy BotReport index set with mapped names', () => {
      // Must contain compound unique index mapped to legacy name
      expect(schemaContent).toMatch(
        /@@unique\(\[reporterId,\s*userId\],\s*map:\s*"_reporterId_1__reportedUserId_1"\)/
      );

      // Must contain single index on userId mapped to legacy name
      expect(schemaContent).toMatch(/@@index\(\[userId\],\s*map:\s*"_reportedUserId_1"\)/);

      // Must contain descending index on createdAt
      expect(schemaContent).toMatch(
        /@@index\(\[createdAt\(sort:\s*Desc\)\],\s*map:\s*"createdAt_-1"\)/
      );

      // Must NOT contain the Prisma-only @@index([reporterId]) inside model BotReport
      const botReportModel = schemaContent.substring(
        schemaContent.indexOf('model BotReport {'),
        schemaContent.indexOf('}', schemaContent.indexOf('model BotReport {')) + 1
      );
      expect(botReportModel).not.toMatch(/@@index\(\[reporterId\]\)/);
    });

    it('should map UserReport fields to legacy MongoDB field names and make timestamps optional', () => {
      expect(schemaContent).toMatch(/reporterId\s+String\s+@map\("_reporterId"\)\s+@db\.ObjectId/);
      expect(schemaContent).toMatch(
        /reportedUserId\s+String\s+@map\("_reportedUserId"\)\s+@db\.ObjectId/
      );
      expect(schemaContent).toMatch(/created\s+DateTime\?\s+@default\(now\(\)\)/);
      expect(schemaContent).toMatch(/updatedAt\s+DateTime\?\s+@updatedAt/);
    });

    it('should preserve exactly the legacy UserReport index set with mapped names', () => {
      expect(schemaContent).toMatch(
        /@@index\(\[reportedUserId,\s*status\],\s*map:\s*"_reportedUserId_1_status_1"\)/
      );
      expect(schemaContent).toMatch(/@@index\(\[reporterId\],\s*map:\s*"_reporterId_1"\)/);
      expect(schemaContent).toMatch(
        /@@index\(\[createdAt\(sort:\s*Desc\)\],\s*map:\s*"createdAt_-1"\)/
      );

      const userReportModel = schemaContent.substring(
        schemaContent.indexOf('model UserReport {'),
        schemaContent.indexOf('}', schemaContent.indexOf('model UserReport {')) + 1
      );
      expect(userReportModel).not.toMatch(/@@index\(\[reportedUserId\][,)]/);
      expect(userReportModel).not.toMatch(/@@index\(\[status\]\)/);
    });
  });

  describe('Mongoose BotReport Model Definition', () => {
    it('should define stored fields using legacy names', () => {
      expect(BotReport.schema.path('_reportedUserId')).toBeDefined();
      expect(BotReport.schema.path('_reporterId')).toBeDefined();
    });

    it('should provide aliases for userId and reporterId', () => {
      expect(aliasesOf(BotReport.schema)?.userId).toBe('_reportedUserId');
      expect(aliasesOf(BotReport.schema)?.reporterId).toBe('_reporterId');
    });

    it('should configure legacy named indexes', () => {
      const indexes = BotReport.schema.indexes();
      const indexNames = indexes.map(([, options]) => options?.name);

      expect(indexNames).toContain('_reporterId_1__reportedUserId_1');
      expect(indexNames).toContain('_reportedUserId_1');
      expect(indexNames).toContain('createdAt_-1');

      // Check unique index option
      const uniqueIndex = indexes.find(
        ([, options]) => options?.name === '_reporterId_1__reportedUserId_1'
      );
      expect(uniqueIndex?.[1]?.unique).toBe(true);
    });
  });

  describe('Mongoose UserReport Model Definition', () => {
    it('should define stored fields using legacy names', () => {
      expect(UserReport.schema.path('_reportedUserId')).toBeDefined();
      expect(UserReport.schema.path('_reporterId')).toBeDefined();
    });

    it('should provide aliases for reportedUserId and reporterId', () => {
      expect(aliasesOf(UserReport.schema)?.reportedUserId).toBe('_reportedUserId');
      expect(aliasesOf(UserReport.schema)?.reporterId).toBe('_reporterId');
    });

    it('should configure legacy named indexes', () => {
      const indexes = UserReport.schema.indexes();
      const indexNames = indexes.map(([, options]) => options?.name);

      expect(indexNames).toContain('_reportedUserId_1_status_1');
      expect(indexNames).toContain('_reporterId_1');
      expect(indexNames).toContain('createdAt_-1');
    });
  });

  describe('Legacy & Prisma Deduplication Behavior', () => {
    it('should verify that legacy and Prisma reports share the exact same MongoDB unique index key', () => {
      // Both rely on {_reporterId: 1, _reportedUserId: 1} unique index
      const indexes = BotReport.schema.indexes();
      const uniqueIndex = indexes.find(
        ([fields]) => (fields as Record<string, number>)._reporterId === 1 && (fields as Record<string, number>)._reportedUserId === 1
      );
      expect(uniqueIndex).toBeDefined();
      expect(uniqueIndex?.[1]?.unique).toBe(true);
      expect(uniqueIndex?.[1]?.name).toBe('_reporterId_1__reportedUserId_1');
    });

    it('should delete unmapped report when a mapped duplicate report already exists during repair', async () => {
      const mockUnmappedDoc = {
        _id: 'doc_unmapped',
        reporterId: 'rep1',
        userId: 'user1',
      };
      const mockExisting = {
        _id: 'doc_mapped',
        _reporterId: 'rep1',
        _reportedUserId: 'user1',
      };

      const mockBotReportCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([mockUnmappedDoc]),
        }),
        findOne: jest.fn().mockResolvedValue(mockExisting),
        deleteOne: jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
        updateOne: jest.fn(),
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
      };

      const mockUserCollection = {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        updateOne: jest.fn(),
      };

      const mockDb = {
        collection: jest.fn((name: string) => {
          if (name === 'botreports') return mockBotReportCollection;
          if (name === 'users') return mockUserCollection;
          return null;
        }),
      };

      const originalDb = mongoose.connection.db;
      Object.defineProperty(mongoose.connection, 'db', {
        value: mockDb,
        configurable: true,
      });

      try {
        const { repairBotReports } = await import('../../../scripts/repair-bot-reports');
        const summary = await repairBotReports({ dryRun: false });

        expect(mockBotReportCollection.findOne).toHaveBeenCalledWith({
          _id: { $ne: 'doc_unmapped' },
          _reporterId: 'rep1',
          _reportedUserId: 'user1',
        });
        expect(mockBotReportCollection.deleteOne).toHaveBeenCalledWith({ _id: 'doc_unmapped' });
        expect(mockBotReportCollection.updateOne).not.toHaveBeenCalled();
        expect(summary.duplicatesRemoved).toBe(1);
        expect(summary.unmappedFixed).toBe(0);
      } finally {
        Object.defineProperty(mongoose.connection, 'db', {
          value: originalDb,
          configurable: true,
        });
      }
    });
  });
});
