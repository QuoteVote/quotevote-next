/// <reference types="node" />
/**
 * Read-only data check (#183): document counts, index lists and records the backend can't
 * read, for every collection in the database at DATABASE_URL.
 *
 * Usage:
 *   pnpm data:check [--out <file>]
 *     Writes the report as JSON (default: data-check-<database>-<timestamp>.json) and prints
 *     a summary.
 *   pnpm data:check --compare <first.json> <second.json> [--indexes-only]
 *     Lists every difference between two reports and exits with 1 if there is any.
 *
 * Only read commands are sent. Reports hold counts, field names and index keys, never
 * document contents, ids or the connection string.
 */
import fs from 'fs';
import { config } from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';
import { compareReports, formatSummary, runDataCheck } from '~/data/utils/dataCheck';
import type { DataCheckEnum, DataCheckModel, DataCheckReport } from '~/types/dataCheck';

config();

function argValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function databaseName(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, '')) || 'unknown';
  } catch {
    return 'unknown';
  }
}

function readReport(path: string): DataCheckReport {
  const report = JSON.parse(fs.readFileSync(path, 'utf8')) as DataCheckReport;
  if (report.tool !== 'data-check') throw new Error(`${path} is not a data check report`);
  return report;
}

function compare(args: string[]): void {
  const i = args.indexOf('--compare');
  const [first, second] = [args[i + 1], args[i + 2]];
  if (!first || !second) throw new Error('--compare needs two report files');

  const differences = compareReports(readReport(first), readReport(second), {
    indexesOnly: args.includes('--indexes-only'),
  });
  if (differences.length === 0) {
    console.log('The reports match.');
    return;
  }
  console.log(`${differences.length} difference(s):`);
  for (const line of differences) console.log(`  ${line}`);
  process.exitCode = 1;
}

async function check(args: string[]): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const database = databaseName(url);
  const prisma = new PrismaClient();
  try {
    const report = await runDataCheck({
      run: (command) => prisma.$runCommandRaw(command as Prisma.InputJsonObject),
      database,
      models: Prisma.dmmf.datamodel.models as unknown as DataCheckModel[],
      enums: Prisma.dmmf.datamodel.enums as unknown as DataCheckEnum[],
    });
    const stamp = report.generatedAt.replace(/[-:]/g, '').replace(/\..*$/, '');
    const out = argValue(args, '--out') ?? `data-check-${database}-${stamp}.json`;
    fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
    console.log(formatSummary(report));
    console.log(`\nReport written to ${out}`);
  } finally {
    await prisma.$disconnect();
  }
}

const args = process.argv.slice(2);
(args.includes('--compare') ? Promise.resolve(compare(args)) : check(args)).catch(
  (err: unknown) => {
    console.error('data check failed:', err instanceof Error ? err.message : 'unknown error');
    process.exit(1);
  }
);
