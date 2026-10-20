import { createClient } from '@supabase/supabase-js';
import plantsData from '@/data/plants.json';
import { US_STATES } from '@/lib/states';
import { median, shiftIsoDate } from './dates';
import { seasonOf } from './format';
import { dbStateToUi, type DbUnitState, type UnitState } from './unitState';

export interface CurrentOutageView {
  type: string;
  startDate: string;
  endDate: string | null;
  durationDays: number | null;
  dayOfOutage: number | null;
  expectedReturn: string | null;
}

export interface ForecastView {
  forecastStart: string;
  windowStart: string;
  windowEnd: string;
  durationDays: number;
  confidence: string;
  dueNow: boolean;
  cycleDays: number | null;
}

export interface HistoryOutage {
  type: string;
  startDate: string;
  endDate: string | null;
  durationDays: number | null;
}

export interface ScheduleUnit {
  unitId: string;
  nrcName: string;
  plantId: string;
  plantName: string;
  plantSlug: string;
  unitLabel: string;
  stateCode: string;
  stateName: string;
  operator: string;
  state: UnitState;
  power: number | null;
  current: CurrentOutageView | null;
  lastRefueling: HistoryOutage | null;
  forecast: ForecastView | null;
  cycleDays: number | null;
}

export interface OutageSchedule {
  asOf: string;
  reportDate: string;
  units: ScheduleUnit[];
  medianRefuelingDays: number | null;
  refuelingSample: number;
  refuelingCount: number;
  seasonalRefuelingCount: number;
  medianCycleDays: number | null;
}

interface UnitRow {
  id: string;
  nrc_name: string;
  plant_id: string | null;
  unit_number: number | null;
  unit_state:
    | {
        state: DbUnitState;
        power_pct: number | null;
        report_date: string | null;
        day_of_outage: number | null;
        expected_return: string | null;
        outage_id: string | null;
        outages: { type: string } | { type: string }[] | null;
      }
    | null;
}

interface OutageRow {
  id: string;
  unit_id: string;
  start_date: string;
  end_date: string | null;
  duration_days: number | null;
  type: string;
  is_current: boolean;
}

interface ForecastRow {
  unit_id: string;
  forecast_start: string;
  window_start: string;
  window_end: string;
  forecast_duration_days: number;
  confidence: string;
  basis: { dueNow?: boolean; cycleDays?: number } | null;
}

function anon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function pageAll<T>(
  load: (
    from: number,
    to: number,
  ) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await load(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export async function getOutageSchedule(): Promise<OutageSchedule | null> {
  const db = anon();
  if (!db) return null;

  const [unitRows, outageRows, forecastRows] = await Promise.all([
    pageAll<UnitRow>(async (from, to) => {
      const result = await db
        .from('units')
        .select(
          'id, nrc_name, plant_id, unit_number, unit_state(state, power_pct, report_date, day_of_outage, expected_return, outage_id, outages(type))',
        )
        .eq('active', true)
        .order('nrc_name')
        .range(from, to);
      return { data: (result.data ?? null) as UnitRow[] | null, error: result.error };
    }),
    pageAll<OutageRow>(async (from, to) => {
      const result = await db
        .from('outages')
        .select('id, unit_id, start_date, end_date, duration_days, type, is_current')
        .or('type.eq.refueling,is_current.eq.true')
        .order('start_date', { ascending: false })
        .range(from, to);
      return { data: (result.data ?? null) as OutageRow[] | null, error: result.error };
    }),
    pageAll<ForecastRow>(async (from, to) => {
      const result = await db
        .from('outage_forecasts')
        .select(
          'unit_id, forecast_start, window_start, window_end, forecast_duration_days, confidence, basis',
        )
        .range(from, to);
      return { data: (result.data ?? null) as ForecastRow[] | null, error: result.error };
    }),
  ]);

  const plants = new Map(plantsData.plants.map((plant) => [plant.id, plant]));
  const outagesByUnit = new Map<string, OutageRow[]>();
  for (const row of outageRows) {
    const list = outagesByUnit.get(row.unit_id) ?? [];
    list.push(row);
    outagesByUnit.set(row.unit_id, list);
  }
  const forecastByUnit = new Map(forecastRows.map((row) => [row.unit_id, row]));

  let latest = '';
  const completedDurations: number[] = [];
  const cycleSamples: number[] = [];
  let refuelingCount = 0;
  let seasonalRefuelingCount = 0;
  const fiveYearsAgo = shiftIsoDate(new Date().toISOString().slice(0, 10), -365 * 5);

  const units: ScheduleUnit[] = [];
  for (const row of unitRows) {
    const plant = row.plant_id ? plants.get(row.plant_id) : undefined;
    if (!plant) continue;
    const stateRow = one(row.unit_state);
    const reportDate = stateRow?.report_date ?? '';
    if (reportDate > latest) latest = reportDate;
    const outageEmbed = stateRow ? one(stateRow.outages) : null;
    const history = (outagesByUnit.get(row.id) ?? [])
      .slice()
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    const currentRow = history.find((outage) => outage.is_current) ?? null;
    const lastRefueling =
      history.find((outage) => outage.type === 'refueling' && outage.end_date) ?? null;
    const forecast = forecastByUnit.get(row.id) ?? null;

    const refuelingStarts = history
      .filter((outage) => outage.type === 'refueling')
      .map((outage) => outage.start_date)
      .sort();
    for (const start of refuelingStarts) {
      refuelingCount += 1;
      if (seasonOf(start)) seasonalRefuelingCount += 1;
    }
    const cycleDays = cycleFromStarts(refuelingStarts);
    if (cycleDays) cycleSamples.push(cycleDays);

    for (const outage of history) {
      if (
        outage.type === 'refueling' &&
        outage.end_date &&
        outage.duration_days &&
        outage.start_date >= fiveYearsAgo
      ) {
        completedDurations.push(outage.duration_days);
      }
    }

    units.push({
      unitId: row.id,
      nrcName: row.nrc_name,
      plantId: plant.id,
      plantName: plant.name,
      plantSlug: plant.id,
      unitLabel: row.unit_number ? `Unit ${row.unit_number}` : plant.name,
      stateCode: plant.state,
      stateName: US_STATES.find((state) => state.code === plant.state)?.name ?? plant.state,
      operator: plant.operator,
      state: stateRow ? dbStateToUi(stateRow.state, outageEmbed?.type) : 'unknown',
      power: stateRow?.power_pct ?? null,
      current: currentRow
        ? {
            type: currentRow.type,
            startDate: currentRow.start_date,
            endDate: currentRow.end_date,
            durationDays: currentRow.duration_days,
            dayOfOutage: stateRow?.day_of_outage ?? null,
            expectedReturn:
              currentRow.type === 'refueling' ? stateRow?.expected_return ?? null : null,
          }
        : null,
      lastRefueling: lastRefueling
        ? {
            type: lastRefueling.type,
            startDate: lastRefueling.start_date,
            endDate: lastRefueling.end_date,
            durationDays: lastRefueling.duration_days,
          }
        : null,
      forecast: forecast
        ? {
            forecastStart: forecast.forecast_start,
            windowStart: forecast.window_start,
            windowEnd: forecast.window_end,
            durationDays: forecast.forecast_duration_days,
            confidence: forecast.confidence,
            dueNow: forecast.basis?.dueNow === true,
            cycleDays: typeof forecast.basis?.cycleDays === 'number' ? forecast.basis.cycleDays : null,
          }
        : null,
      cycleDays,
    });
  }

  return {
    asOf: latest,
    reportDate: latest,
    units,
    medianRefuelingDays: completedDurations.length > 0 ? median(completedDurations) : null,
    refuelingSample: completedDurations.length,
    refuelingCount,
    seasonalRefuelingCount,
    medianCycleDays: cycleSamples.length > 0 ? median(cycleSamples) : null,
  };
}

function cycleFromStarts(starts: string[]): number | null {
  const recent = starts.slice(-5);
  const intervals: number[] = [];
  for (let index = 1; index < recent.length; index += 1) {
    intervals.push(calendarGap(recent[index - 1], recent[index]));
  }
  if (intervals.length === 0) return null;
  return median(intervals);
}

function calendarGap(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  return Math.round(
    (Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) /
      86_400_000,
  );
}

export async function getPlantOutageHistory(unitIds: string[]): Promise<Map<string, HistoryOutage[]>> {
  const grouped = new Map<string, HistoryOutage[]>();
  if (unitIds.length === 0) return grouped;
  const db = anon();
  if (!db) return grouped;

  const rows = await pageAll<OutageRow>(async (from, to) => {
    const result = await db
      .from('outages')
      .select('id, unit_id, start_date, end_date, duration_days, type, is_current')
      .in('unit_id', unitIds)
      .order('start_date', { ascending: false })
      .range(from, to);
    return { data: (result.data ?? null) as OutageRow[] | null, error: result.error };
  });

  for (const row of rows) {
    const list = grouped.get(row.unit_id) ?? [];
    if (list.length >= 5) continue;
    list.push({
      type: row.type,
      startDate: row.start_date,
      endDate: row.end_date,
      durationDays: row.duration_days,
    });
    grouped.set(row.unit_id, list);
  }
  return grouped;
}
