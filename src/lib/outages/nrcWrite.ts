import type { SupabaseClient } from '@supabase/supabase-js';
import type { DbUnitState } from './unitState';
import { normalizeNrcName, parseNrcReportDate, type DailyReportRow, type PowerStatusRow } from './nrcParse';

export interface StoredUnit {
  id: string;
  plant_id: string | null;
  unit_number: number | null;
  nrc_name: string;
  nrc_aliases: string[] | null;
  active: boolean;
  status_override: string | null;
}

export interface PowerWrite {
  unit_id: string;
  report_date: string;
  power_pct: number;
  source: 'nrc_365' | 'nrc_yearly' | 'nrc_daily_page';
}

export interface CommentWrite {
  unit_id: string;
  report_date: string;
  power_pct: number | null;
  down_date: string | null;
  reason_comment: string | null;
  scrams: number | null;
}

const BATCH = 400;

export async function loadUnits(db: SupabaseClient): Promise<StoredUnit[]> {
  const rows: StoredUnit[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from('units')
      .select('id, plant_id, unit_number, nrc_name, nrc_aliases, active, status_override')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as StoredUnit[]));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export function indexUnits(units: StoredUnit[]): Map<string, StoredUnit> {
  const byName = new Map<string, StoredUnit>();
  for (const unit of units) {
    byName.set(normalizeNrcName(unit.nrc_name), unit);
    for (const alias of unit.nrc_aliases ?? []) {
      byName.set(normalizeNrcName(alias), unit);
    }
  }
  return byName;
}

export async function ensureRetiredUnit(
  db: SupabaseClient,
  byName: Map<string, StoredUnit>,
  nrcName: string,
): Promise<StoredUnit> {
  const existing = byName.get(nrcName);
  if (existing) return existing;

  const unitNumber = nrcName.match(/\s(\d+)$/);
  const { data, error } = await db
    .from('units')
    .insert({
      plant_id: null,
      unit_number: unitNumber ? Number(unitNumber[1]) : null,
      nrc_name: nrcName,
      nrc_aliases: [],
      active: false,
    })
    .select('id, plant_id, unit_number, nrc_name, nrc_aliases, active, status_override')
    .single();
  if (error) throw new Error(`Could not store retired unit ${nrcName}: ${error.message}`);
  const stored = data as StoredUnit;
  byName.set(nrcName, stored);
  return stored;
}

async function restUpsert(table: string, onConflict: string, rows: object[]): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role env');

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const response = await fetch(`${url}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Upsert ${table} failed (${response.status}): ${body.slice(0, 400)}`);
    }
    if (rows.length > BATCH) {
      console.log(`${table} ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
    }
  }
}

/** Power columns only, so a second run does not wipe comment fields. */
export async function upsertPowerRows(rows: PowerWrite[]): Promise<void> {
  const now = new Date().toISOString();
  const deduped = new Map<string, PowerWrite & { fetched_at: string }>();
  for (const row of rows) {
    deduped.set(`${row.unit_id}|${row.report_date}`, { ...row, fetched_at: now });
  }
  await restUpsert('unit_daily_status', 'unit_id,report_date', [...deduped.values()]);
}

/**
 * Fills comment fields. Includes power only when the page has a number,
 * so a blank power cell cannot null out the stored percent.
 */
export interface UnitStateWrite {
  unit_id: string;
  state: DbUnitState;
  state_since: string | null;
  power_pct: number | null;
  day_of_outage: number | null;
  report_date: string | null;
  outage_id?: string | null;
  expected_return?: string | null;
}

export interface OutageWrite {
  unit_id: string;
  start_date: string;
  end_date: string | null;
  duration_days: number;
  type: 'refueling' | 'unplanned' | 'maintenance' | 'unknown';
  classification_score: number;
  classification_signals: Record<string, unknown>;
  is_extended: boolean;
  is_current: boolean;
}

export interface ForecastWrite {
  unit_id: string;
  forecast_start: string;
  window_start: string;
  window_end: string;
  forecast_duration_days: number;
  confidence: 'forecast' | 'isi_letter' | 'coastdown' | 'started';
  basis: Record<string, unknown>;
}

function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error('Supabase admin credentials are not set');
  }
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

async function clearCurrentOutages(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const response = await fetch(`${url}/rest/v1/outages?is_current=eq.true`, {
    method: 'PATCH',
    headers: adminHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    }),
    body: JSON.stringify({ is_current: false }),
  });
  if (!response.ok) throw new Error(`Could not clear current outages (${response.status})`);
}

async function listOutageKeys(): Promise<{ id: string; unit_id: string; start_date: string }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rows: { id: string; unit_id: string; start_date: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const response = await fetch(
      `${url}/rest/v1/outages?select=id,unit_id,start_date&order=id.asc&offset=${from}&limit=1000`,
      { headers: adminHeaders() },
    );
    if (!response.ok) throw new Error(`Could not list outages (${response.status})`);
    const page = (await response.json()) as { id: string; unit_id: string; start_date: string }[];
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

async function deleteOutageIds(ids: string[]): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    const response = await fetch(`${url}/rest/v1/outages?id=in.(${batch.join(',')})`, {
      method: 'DELETE',
      headers: adminHeaders({ Prefer: 'return=minimal' }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Could not delete stale outages (${response.status}): ${body.slice(0, 200)}`);
    }
  }
}

/** Upsert on (unit_id, start_date) and drop starts that this run no longer detects. */
export async function replaceOutages(rows: OutageWrite[]): Promise<Map<string, string>> {
  await clearCurrentOutages();
  await restUpsert('outages', 'unit_id,start_date', rows);

  const wanted = new Set(rows.map((row) => `${row.unit_id}|${row.start_date}`));
  const existing = await listOutageKeys();
  const stale = existing.filter((row) => !wanted.has(`${row.unit_id}|${row.start_date}`)).map((row) => row.id);
  if (stale.length > 0) await deleteOutageIds(stale);

  const ids = new Map<string, string>();
  for (const row of existing) {
    const key = `${row.unit_id}|${row.start_date}`;
    if (wanted.has(key)) ids.set(key, row.id);
  }
  const missing = rows.filter((row) => !ids.has(`${row.unit_id}|${row.start_date}`));
  if (missing.length > 0) {
    const fresh = await listOutageKeys();
    for (const row of fresh) ids.set(`${row.unit_id}|${row.start_date}`, row.id);
  }
  return ids;
}

export async function replaceForecasts(rows: ForecastWrite[]): Promise<void> {
  await restUpsert('outage_forecasts', 'unit_id', rows);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const response = await fetch(`${url}/rest/v1/outage_forecasts?select=unit_id`, {
    headers: adminHeaders(),
  });
  if (!response.ok) throw new Error(`Could not list forecasts (${response.status})`);
  const existing = (await response.json()) as { unit_id: string }[];
  const wanted = new Set(rows.map((row) => row.unit_id));
  const stale = existing.filter((row) => !wanted.has(row.unit_id)).map((row) => row.unit_id);
  for (let index = 0; index < stale.length; index += 100) {
    const batch = stale.slice(index, index + 100);
    const deleted = await fetch(`${url}/rest/v1/outage_forecasts?unit_id=in.(${batch.join(',')})`, {
      method: 'DELETE',
      headers: adminHeaders({ Prefer: 'return=minimal' }),
    });
    if (!deleted.ok) throw new Error(`Could not delete stale forecasts (${deleted.status})`);
  }
}

export async function upsertUnitStates(rows: UnitStateWrite[]): Promise<void> {
  const now = new Date().toISOString();
  await restUpsert(
    'unit_state',
    'unit_id',
    rows.map((row) => ({ ...row, updated_at: now })),
  );
}

export interface UnmatchedName {
  name: string;
  count: number;
  first: string;
  last: string;
}

export function resolvePowerWrites(
  rows: PowerStatusRow[],
  byName: Map<string, StoredUnit>,
  source: PowerWrite['source'],
): { writes: PowerWrite[]; unmatched: UnmatchedName[] } {
  const unmatched = new Map<string, UnmatchedName>();
  const writes: PowerWrite[] = [];

  for (const row of rows) {
    if (row.power < 0 || row.power > 200) continue;
    const unit = byName.get(row.unit);
    if (!unit) {
      const current = unmatched.get(row.unit) ?? {
        name: row.unit,
        count: 0,
        first: row.reportDate,
        last: row.reportDate,
      };
      current.count += 1;
      if (row.reportDate < current.first) current.first = row.reportDate;
      if (row.reportDate > current.last) current.last = row.reportDate;
      unmatched.set(row.unit, current);
      continue;
    }
    writes.push({
      unit_id: unit.id,
      report_date: row.reportDate,
      power_pct: row.power,
      source,
    });
  }

  return {
    writes,
    unmatched: [...unmatched.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
  };
}

function normalizeDownDate(raw: string | null): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return parseNrcReportDate(raw);
}

export function resolveCommentWrites(
  rows: DailyReportRow[],
  reportDate: string,
  byName: Map<string, StoredUnit>,
): { writes: CommentWrite[]; unmatched: string[] } {
  const unmatched = new Set<string>();
  const writes: CommentWrite[] = [];

  for (const row of rows) {
    const unit = byName.get(row.unit);
    if (!unit) {
      unmatched.add(row.unit);
      continue;
    }
    if (row.power === null || row.power < 0 || row.power > 200) continue;
    writes.push({
      unit_id: unit.id,
      report_date: reportDate,
      power_pct: row.power,
      down_date: normalizeDownDate(row.downDate),
      reason_comment: row.reasonComment,
      scrams: row.scrams,
    });
  }

  return { writes, unmatched: [...unmatched].sort() };
}

export async function upsertCommentRows(rows: CommentWrite[]): Promise<void> {
  const now = new Date().toISOString();
  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const payload: Record<string, unknown> = {
      unit_id: row.unit_id,
      report_date: row.report_date,
      down_date: row.down_date,
      reason_comment: row.reason_comment,
      scrams: row.scrams,
      source: 'nrc_daily_page',
      fetched_at: now,
    };
    if (row.power_pct !== null) payload.power_pct = row.power_pct;
    deduped.set(`${row.unit_id}|${row.report_date}`, payload);
  }
  await restUpsert('unit_daily_status', 'unit_id,report_date', [...deduped.values()]);
}
