import { createClient } from '@supabase/supabase-js';
import { getNrcStatus } from '@/lib/nrc';
import {
  dbStateToUi,
  unitsFromReport,
  type DbUnitState,
  type UnitSnapshot,
} from './unitState';

/** Use stored state once it covers the active fleet. Otherwise keep the live NRC file. */
const MIN_STORED_UNITS = 90;

export interface FleetReadings {
  reportDate: string;
  stored: Map<string, UnitSnapshot> | null;
  live: Record<string, number> | null;
}

interface StoredState {
  state: DbUnitState;
  power_pct: number | null;
  report_date: string | null;
  outages: { type: string } | { type: string }[] | null;
}

interface StoredRow {
  nrc_name: string;
  unit_state: StoredState | StoredState[] | null;
}

function oneState(value: StoredRow['unit_state']) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function formatReportDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${Number(month)}/${Number(day)}/${year}`;
}

async function readStoredFleet(): Promise<{ byName: Map<string, UnitSnapshot>; reportDate: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db
    .from('units')
    .select('nrc_name, unit_state(state, power_pct, report_date, outages(type))')
    .eq('active', true)
    .abortSignal(AbortSignal.timeout(4000));

  if (error) throw new Error(error.message);

  const byName = new Map<string, UnitSnapshot>();
  let latest = '';
  for (const row of (data ?? []) as StoredRow[]) {
    const state = oneState(row.unit_state);
    if (!state) continue;
    if (state.report_date && state.report_date > latest) latest = state.report_date;
    const outage = Array.isArray(state.outages) ? state.outages[0] : state.outages;
    byName.set(row.nrc_name, {
      nrcName: row.nrc_name,
      power: state.power_pct,
      state: dbStateToUi(state.state, outage?.type),
    });
  }
  if (byName.size < MIN_STORED_UNITS) return null;
  return { byName, reportDate: latest ? formatReportDate(latest) : '' };
}

export async function getFleetReadings(): Promise<FleetReadings> {
  try {
    const stored = await readStoredFleet();
    if (stored) {
      return { reportDate: stored.reportDate, stored: stored.byName, live: null };
    }
  } catch (error) {
    console.error('[fleet] stored unit state unavailable', error);
  }

  const live = await getNrcStatus();
  return { reportDate: live.reportDate, stored: null, live: live.status };
}

export function unitsForPlant(
  units: { nrcName: string }[],
  readings: FleetReadings,
  restarting: boolean,
): UnitSnapshot[] {
  if (!readings.stored) return unitsFromReport(units, readings.live ?? {}, restarting);
  return units.map((unit) => {
    const stored = readings.stored!.get(unit.nrcName);
    if (stored) return stored;
    const [fallback] = unitsFromReport([unit], readings.live ?? {}, restarting);
    return fallback;
  });
}
