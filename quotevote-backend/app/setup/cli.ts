/**
 * First-time setup for a new instance. See docs/backend/instance-setup.md.
 *
 *   setup indexes [--apply]   the indexes the backend needs (report only without --apply)
 *   setup admin               the first administrator; asks, password hidden
 *   setup demo <file.json>    starting tags and posts, posted by the first administrator
 *
 * Prints names and counts only, never passwords or record contents.
 */
import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import { Prisma } from '@prisma/client';
// Loads the models and resolvers as the server does.
import '~/data/schema';
import { prisma } from '~/lib/prisma';
import { applyIndexPlan, describePlan, planDatabaseIndexes } from '~/data/utils/modelIndexRun';
import {
  ensureUniqueIndexes,
  formatUniqueIndexResults,
  needsAttention,
} from '~/data/utils/uniqueIndexes';
import { createFirstAdmin, parseDemoContent, seedDemoContent } from '~/setup/instanceSetup';
import type { UniqueIndexModel } from '~/types/uniqueIndexes';

const USAGE = 'usage: setup indexes [--apply] | setup admin | setup demo <file.json>';

async function indexes(apply: boolean): Promise<void> {
  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error('Set MONGO_URI or DATABASE_URL');
  await mongoose.connect(uri, { autoIndex: false, autoCreate: false });
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('No database connection');
    const plan = await planDatabaseIndexes(db);
    describePlan(plan).forEach((line) => console.log(line));
    if (plan.conflicts.length > 0) {
      throw new Error('Resolve the conflicts above by hand. Nothing was changed.');
    }
    // Unique indexes check the records for duplicates before anything is created (#702).
    const uniques = await ensureUniqueIndexes({
      run: (command) => prisma.$runCommandRaw(command as Prisma.InputJsonObject),
      models: Prisma.dmmf.datamodel.models as unknown as UniqueIndexModel[],
      dryRun: true,
    });
    console.log(formatUniqueIndexResults(uniques));
    if (needsAttention(uniques).length > 0) {
      throw new Error('Unique indexes need attention (see above). Nothing was changed.');
    }
    if (!apply) {
      console.log('Report only. Run with --apply to build what is missing.');
      return;
    }
    await applyIndexPlan(db, plan, (line) => console.log(line));
    const created = await ensureUniqueIndexes({
      run: (command) => prisma.$runCommandRaw(command as Prisma.InputJsonObject),
      models: Prisma.dmmf.datamodel.models as unknown as UniqueIndexModel[],
      dryRun: false,
    });
    console.log(formatUniqueIndexResults(created));
    if (needsAttention(created).length > 0) throw new Error('Unique indexes need attention.');
    console.log('Indexes are in place.');
  } finally {
    await mongoose.disconnect();
  }
}

/** Reads answers line by line; hidden answers aren't echoed on a terminal. */
function prompter(): { ask: (q: string, hidden?: boolean) => Promise<string>; close: () => void } {
  const tty = Boolean(process.stdin.isTTY);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: tty,
  });
  let muted = false;
  const output = rl as unknown as { _writeToOutput: (s: string) => void };
  output._writeToOutput = (s: string) => {
    if (!muted) process.stdout.write(s);
  };
  const lines = rl[Symbol.asyncIterator]();
  return {
    ask: async (question, hidden = false) => {
      process.stdout.write(question);
      muted = hidden;
      const { value } = await lines.next();
      muted = false;
      if (hidden || !tty) process.stdout.write('\n');
      return typeof value === 'string' ? value : '';
    },
    close: () => rl.close(),
  };
}

async function admin(): Promise<void> {
  const { ask, close } = prompter();
  try {
    const email = await ask('Admin email: ');
    const username = await ask('Admin username: ');
    const name = await ask('Admin display name (Enter for the username): ');
    const password = await ask(`Admin password (hidden, 12+ characters): `, true);
    const again = await ask('Repeat the password: ', true);
    if (password !== again) throw new Error('The passwords differ. Nothing was changed.');
    const result = await createFirstAdmin(prisma, { email, username, name, password });
    console.log(
      result === 'created'
        ? `Administrator "${username.trim()}" created.`
        : `Administrator "${username.trim()}" already exists and was left as is.`
    );
  } finally {
    close();
  }
}

async function demo(file: string | undefined): Promise<void> {
  if (!file) throw new Error(USAGE);
  const content = parseDemoContent(JSON.parse(fs.readFileSync(file, 'utf8')));
  const result = await seedDemoContent(prisma, content, (line) => console.log(line));
  console.log(
    `Tags: ${result.tagsCreated} created, ${result.tagsKept} kept. Posts: ${result.postsCreated} created, ${result.postsKept} kept.`
  );
}

export async function run(argv: string[]): Promise<void> {
  const [step, arg] = argv;
  try {
    if (step === 'indexes') await indexes(argv.includes('--apply'));
    else if (step === 'admin') await admin();
    else if (step === 'demo') await demo(arg);
    else throw new Error(USAGE);
  } finally {
    await prisma.$disconnect();
  }
}
