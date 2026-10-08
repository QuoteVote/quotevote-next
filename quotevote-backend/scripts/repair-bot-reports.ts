/// <reference types="node" />
/**
 * Repair Bot Reports & Aggregate Counters
 *
 * Resolves compatibility issues for BotReport data:
 * 1. Finds and migrates any botreports documents written with unmapped field names
 *    (e.g., `reporterId` instead of `_reporterId`, or `userId` instead of `_reportedUserId`).
 * 2. Deduplicates any duplicate bot reports by (_reporterId, _reportedUserId).
 * 3. Recomputes User.botReports and User.lastBotReportDate from the BotReport collection.
 *
 * Usage:
 *   tsx scripts/repair-bot-reports.ts [--dry-run]
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

export interface RepairOptions {
  dryRun?: boolean;
}

export interface RepairSummary {
  unmappedFixed: number;
  duplicatesRemoved: number;
  usersUpdated: number;
}

export async function repairBotReports(options: RepairOptions = {}): Promise<RepairSummary> {
  const { dryRun = false } = options;
  const summary: RepairSummary = {
    unmappedFixed: 0,
    duplicatesRemoved: 0,
    usersUpdated: 0,
  };

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not initialized');
  }

  const botReportCollection = db.collection('botreports');
  const userCollection = db.collection('users');

  // Step 1: Detect and fix documents written with unmapped field names (reporterId / userId)
  const unmappedDocs = await botReportCollection
    .find({
      $or: [
        { reporterId: { $exists: true }, _reporterId: { $exists: false } },
        { userId: { $exists: true }, _reportedUserId: { $exists: false } },
      ],
    })
    .toArray();

  for (const doc of unmappedDocs) {
    const reporterId = doc._reporterId ?? doc.reporterId;
    const reportedUserId = doc._reportedUserId ?? doc.userId;

    if (reporterId && reportedUserId) {
      if (!dryRun) {
        await botReportCollection.updateOne(
          { _id: doc._id },
          {
            $set: {
              _reporterId: reporterId,
              _reportedUserId: reportedUserId,
            },
            $unset: {
              reporterId: '',
              userId: '',
            },
          }
        );
      }
      summary.unmappedFixed += 1;
    }
  }

  // Step 2: Detect duplicates on (_reporterId, _reportedUserId)
  const duplicatesAggregation = await botReportCollection
    .aggregate<{
      _id: { _reporterId: unknown; _reportedUserId: unknown };
      docs: { _id: mongoose.Types.ObjectId; createdAt?: Date }[];
      count: number;
    }>([
      {
        $group: {
          _id: { _reporterId: '$_reporterId', _reportedUserId: '$_reportedUserId' },
          docs: { $push: { _id: '$_id', createdAt: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  for (const group of duplicatesAggregation) {
    const sortedDocs = group.docs.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    const toRemove = sortedDocs.slice(1).map((d) => d._id);
    if (!dryRun && toRemove.length > 0) {
      await botReportCollection.deleteMany({ _id: { $in: toRemove } });
    }
    summary.duplicatesRemoved += toRemove.length;
  }

  // Step 3: Recompute User.botReports and lastBotReportDate
  const userReportCounts = await botReportCollection
    .aggregate<{
      _id: unknown;
      total: number;
      lastDate: Date;
    }>([
      {
        $group: {
          _id: '$_reportedUserId',
          total: { $sum: 1 },
          lastDate: { $max: '$createdAt' },
        },
      },
    ])
    .toArray();

  const countMap = new Map<string, { total: number; lastDate: Date }>();
  for (const item of userReportCounts) {
    if (item._id) {
      countMap.set(String(item._id), { total: item.total, lastDate: item.lastDate });
    }
  }

  const usersWithReports = await userCollection
    .find({
      $or: [
        { botReports: { $gt: 0 } },
        { _id: { $in: Array.from(countMap.keys()).map((id) => new mongoose.Types.ObjectId(id)) } },
      ],
    })
    .toArray();

  for (const u of usersWithReports) {
    const stats = countMap.get(String(u._id)) ?? { total: 0, lastDate: null as unknown as Date };
    const currentCount = u.botReports ?? 0;
    const currentLastDate = u.lastBotReportDate ? new Date(u.lastBotReportDate).getTime() : 0;
    const computedLastDate = stats.lastDate ? new Date(stats.lastDate).getTime() : 0;

    if (currentCount !== stats.total || currentLastDate !== computedLastDate) {
      if (!dryRun) {
        await userCollection.updateOne(
          { _id: u._id },
          {
            $set: {
              botReports: stats.total,
              lastBotReportDate: stats.lastDate ?? null,
            },
          }
        );
      }
      summary.usersUpdated += 1;
    }
  }

  return summary;
}

async function runCli(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');
  const mongoUri = process.env.DATABASE_URL || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ Neither DATABASE_URL nor MONGO_URI is defined in environment');
    process.exit(1);
  }

  console.log(`🔧 Connecting to MongoDB (${isDryRun ? 'DRY RUN' : 'LIVE'})...`);
  await mongoose.connect(mongoUri);

  try {
    const summary = await repairBotReports({ dryRun: isDryRun });
    console.log('✅ Repair completed successfully:');
    console.log(`   • Unmapped documents fixed: ${summary.unmappedFixed}`);
    console.log(`   • Duplicate reports removed: ${summary.duplicatesRemoved}`);
    console.log(`   • User counters updated:    ${summary.usersUpdated}`);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('repair-bot-reports')) {
  runCli().catch((err) => {
    console.error('❌ Repair failed:', err);
    process.exit(1);
  });
}
