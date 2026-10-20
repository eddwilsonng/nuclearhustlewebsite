/**
 * NRC history load. Cached under .cache/nrc so a rerun skips downloads.
 *
 *   tsx scraper/nrc-backfill.ts scan
 *   tsx scraper/nrc-backfill.ts power
 *   tsx scraper/nrc-backfill.ts power --retired
 *   tsx scraper/nrc-backfill.ts power --year 2024
 *   tsx scraper/nrc-backfill.ts comments --from 2021-10-19 --to 2026-10-19
 *   tsx scraper/nrc-backfill.ts states
 *   tsx scraper/nrc-backfill.ts outages
 *
 * `power` writes rows for names already on units (including aliases).
 * `--retired` also inserts inactive units for names that still do not match.
 * The daily cron must not do that. This script is the only place that does.
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import * as path from 'path';
import { NRC_POWER_STATUS_URL, NRC_YEAR_START, nrcDailyUrl, nrcYearUrl } from '../src/lib/outages/config';
import { fetchNrc } from '../src/lib/outages/nrcClient';
import { normalizeNrcName, parseDailyReportPage, parsePowerStatusFile, type PowerStatusRow } from '../src/lib/outages/nrcParse';
import {
  ensureRetiredUnit,
  indexUnits,
  loadUnits,
  resolveCommentWrites,
  resolvePowerWrites,
  upsertCommentRows,
  upsertPowerRows,
  type UnmatchedName,
} from '../src/lib/outages/nrcWrite';
import { rebuildOutages } from '../src/lib/outages/rebuild';
import { createAdminClient } from '../src/lib/supabase/admin';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const CACHE = path.join(__dirname, '..', '.cache', 'nrc');
fs.mkdirSync(CACHE, { recursive: true });
const logPath = path.join(CACHE, 'backfill.log');
for (const method of ['log', 'warn', 'error'] as const) {
  const original = console[method].bind(console);
  console[method] = (...args: unknown[]) => {
    fs.appendFileSync(logPath, args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' ') + '\n');
    original(...args);
  };
}

function argValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let cursor = from; cursor <= to; cursor = shiftIsoDate(cursor, 1)) {
    dates.push(cursor);
  }
  return dates;
}

async function readCache(filePath: string, valid: (text: string) => boolean): Promise<string | null> {
  try {
    const text = await readFile(filePath, 'utf8');
    return valid(text) ? text : null;
  } catch {
    return null;
  }
}

function isPowerFile(text: string): boolean {
  return text.startsWith('ReportDt|') || text.startsWith('\uFEFFReportDt|');
}

function isDailyPage(text: string): boolean {
  return /<tr\b/i.test(text) && !/access denied/i.test(text.slice(0, 500));
}

async function cachedText(
  filePath: string,
  url: string,
  valid: (text: string) => boolean,
): Promise<string | null> {
  const cached = await readCache(filePath, valid);
  if (cached) return cached;

  const response = await fetchNrc(url);
  if (response.status === 404) {
    console.warn(`404 ${url}`);
    return null;
  }
  if (!valid(response.text)) {
    throw new Error(`Unexpected NRC body for ${url}`);
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, response.text);
  return response.text;
}

function mergeUnmatched(into: Map<string, UnmatchedName>, rows: UnmatchedName[]) {
  for (const row of rows) {
    const current = into.get(row.name);
    if (!current) {
      into.set(row.name, { ...row });
      continue;
    }
    current.count += row.count;
    if (row.first < current.first) current.first = row.first;
    if (row.last > current.last) current.last = row.last;
  }
}

async function loadPowerFile(label: string, filePath: string, url: string): Promise<PowerStatusRow[] | null> {
  const text = await cachedText(filePath, url, isPowerFile);
  if (!text) return null;
  const rows = parsePowerStatusFile(text);
  console.log(`${label}: ${rows.length} power rows`);
  return rows;
}

async function main() {
  const mode = process.argv[2] ?? 'power';
  const retired = hasFlag('--retired');
  const yearArg = argValue('--year');
  const currentYear = Number(todayIso().slice(0, 4));
  const years = yearArg
    ? [Number(yearArg)]
    : Array.from({ length: currentYear - NRC_YEAR_START + 1 }, (_, index) => NRC_YEAR_START + index);

  if (mode === 'states') {
    const report = await rebuildOutages(createAdminClient());
    console.log(JSON.stringify({ byState: report.byState, fixtures: report.fixtures }));
    return;
  }

  if (mode === 'outages') {
    const report = await rebuildOutages(createAdminClient());
    console.log(JSON.stringify({
      asOf: report.asOf,
      outages: report.outages,
      forecasts: report.forecasts,
      byType: report.byType,
      byState: report.byState,
      missingBoth: report.missingBoth,
      fixtures: report.fixtures,
    }, null, 2));
    console.log('Comment vocabulary:');
    for (const row of report.comments) console.log(`${row.count}\t${row.text}`);
    return;
  }

  if (mode === 'comments') {
    await backfillComments();
    return;
  }

  if (mode !== 'scan' && mode !== 'power') {
    throw new Error(`Unknown mode ${mode}`);
  }

  const db = createAdminClient();
  const units = await loadUnits(db);
  const byName = indexUnits(units);
  const unmatched = new Map<string, UnmatchedName>();
  let written = 0;

  const donePath = path.join(CACHE, 'years-done.json');
  let doneYears: string[] = [];
  try {
    doneYears = JSON.parse(fs.readFileSync(donePath, 'utf8')) as string[];
  } catch {
    doneYears = [];
  }
  const done = new Set(doneYears);

  async function take(label: string, filePath: string, url: string, source: 'nrc_yearly' | 'nrc_365') {
    const rows = await loadPowerFile(label, filePath, url);
    if (!rows) {
      console.warn(`No power file for ${label}`);
      return;
    }
    if (mode === 'power' && retired) {
      const pending = resolvePowerWrites(rows, byName, source);
      for (const name of pending.unmatched) {
        if (byName.has(name.name)) continue;
        await ensureRetiredUnit(db, byName, name.name);
        console.log(`Retired unit ${name.name} (${name.count} rows, ${name.first} to ${name.last})`);
      }
    }

    const resolved = resolvePowerWrites(rows, byName, source);
    mergeUnmatched(unmatched, resolved.unmatched);

    const already = done.has(label);
    const extraKeys = new Set(
      rows
        .filter((row) => {
          const unit = byName.get(row.unit);
          if (!unit) return false;
          return !unit.active || normalizeNrcName(unit.nrc_name) !== row.unit;
        })
        .map((row) => `${byName.get(row.unit)!.id}|${row.reportDate}`),
    );
    const writes = already
      ? resolved.writes.filter((row) => extraKeys.has(`${row.unit_id}|${row.report_date}`))
      : resolved.writes;

    if (mode === 'power' && writes.length > 0) {
      await upsertPowerRows(writes);
      written += writes.length;
      console.log(
        `${label}: ${already ? 'filled' : 'upserted'} ${writes.length}, unmatched ${resolved.unmatched.length}`,
      );
      if (!already && label !== '365') {
        done.add(label);
        fs.writeFileSync(donePath, JSON.stringify([...done].sort()));
      }
    } else if (already) {
      console.log(`${label}: already loaded, unmatched ${resolved.unmatched.length}`);
    }
  }

  for (const year of years) {
    await take(String(year), path.join(CACHE, 'years', `${year}.txt`), nrcYearUrl(year), 'nrc_yearly');
  }
  await take('365', path.join(CACHE, 'last365.txt'), NRC_POWER_STATUS_URL, 'nrc_365');

  const unmatchedList = [...unmatched.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
  await mkdir(CACHE, { recursive: true });
  await writeFile(path.join(CACHE, 'unmatched.json'), JSON.stringify(unmatchedList, null, 2));
  console.log(`Unmatched names: ${unmatchedList.length}`);
  for (const name of unmatchedList) {
    console.log(`  ${name.count}\t${name.first}\t${name.last}\t${name.name}`);
  }

  if (mode === 'power') {
    const report = await rebuildOutages(db);
    console.log(`Power rows upserted: ${written}`);
    console.log(JSON.stringify(report.byState));
  }
}

async function backfillComments() {
  const today = todayIso();
  const from = argValue('--from') ?? shiftIsoDate(today, -365 * 5);
  const to = argValue('--to') ?? today;
  const donePath = path.join(CACHE, 'comments-done.json');
  let done: string[] = [];
  try {
    done = JSON.parse(await readFile(donePath, 'utf8')) as string[];
  } catch {
    done = [];
  }
  const finished = new Set(done);
  const db = createAdminClient();
  const byName = indexUnits(await loadUnits(db));
  let pages = 0;
  let consecutiveFailures = 0;

  async function saveDone() {
    await mkdir(CACHE, { recursive: true });
    await writeFile(donePath, JSON.stringify([...finished].sort()));
  }

  for (const date of eachDate(from, to)) {
    if (finished.has(date)) continue;
    try {
      const stamp = date.replace(/-/g, '');
      const filePath = path.join(CACHE, 'daily', `${stamp}.html`);
      const cached = await readCache(filePath, isDailyPage);
      let html = cached;
      if (!html) {
        const response = await fetchNrc(nrcDailyUrl(date));
        if (response.status === 404 || !isDailyPage(response.text)) {
          console.warn(`No daily page ${date}`);
          finished.add(date);
          await saveDone();
          consecutiveFailures = 0;
          continue;
        }
        html = response.text;
        await mkdir(path.dirname(filePath), { recursive: true });
        await writeFile(filePath, html);
      }

      const parsed = parseDailyReportPage(html);
      const { writes, unmatched } = resolveCommentWrites(parsed, date, byName);
      if (writes.length > 0) await upsertCommentRows(writes);
      if (unmatched.length > 0) {
        console.warn(`${date} unmatched: ${unmatched.join(', ')}`);
      }
      finished.add(date);
      consecutiveFailures = 0;
      pages += 1;
      if (pages % 20 === 0) {
        await saveDone();
        console.log(`Comments through ${date} (${pages} pages this run)`);
      }
    } catch (error) {
      consecutiveFailures += 1;
      console.error(`Comment page ${date} failed`, error);
      await saveDone();
      if (consecutiveFailures >= 3) throw error;
    }
  }

  await mkdir(CACHE, { recursive: true });
  await writeFile(donePath, JSON.stringify([...finished].sort()));
  const report = await rebuildOutages(db);
  console.log(`Comment pages written this run: ${pages}`);
  console.log(JSON.stringify(report.byState));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
