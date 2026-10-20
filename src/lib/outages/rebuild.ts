import type { SupabaseClient } from '@supabase/supabase-js';
import { modelUnit } from './model';
import type { StatusPoint } from './detect';
import {
  loadUnits,
  replaceForecasts,
  replaceOutages,
  upsertUnitStates,
  type ForecastWrite,
  type OutageWrite,
  type StoredUnit,
  type UnitStateWrite,
} from './nrcWrite';

export interface RebuildReport {
  asOf: string;
  outages: number;
  forecasts: number;
  byType: Record<string, number>;
  byState: Record<string, number>;
  missingBoth: string[];
  fixtures: string[];
  comments: { text: string; count: number }[];
}

const PAGE = 1000;

export async function rebuildOutages(db: SupabaseClient): Promise<RebuildReport> {
  const units = (await loadUnits(db)).filter((unit) => unit.active);
  const points = await loadPoints(db, new Set(units.map((unit) => unit.id)));
  const asOf = fleetAsOf(points, units);

  const outageRows: OutageWrite[] = [];
  const forecastRows: ForecastWrite[] = [];
  const pendingStates: {
    unit: StoredUnit;
    model: ReturnType<typeof modelUnit>;
  }[] = [];
  const byType: Record<string, number> = {};
  const byState: Record<string, number> = {};
  const missingBoth: string[] = [];
  const comments = new Map<string, number>();

  for (const unit of units) {
    const series = points.get(unit.id) ?? [];
    for (const point of series) {
      if (!point.reasonComment) continue;
      comments.set(point.reasonComment, (comments.get(point.reasonComment) ?? 0) + 1);
    }
    const override = unit.status_override === 'restarting' ? 'restarting' : null;
    const model = modelUnit(series, asOf, override);
    pendingStates.push({ unit, model });
    byState[model.state] = (byState[model.state] ?? 0) + 1;

    for (const outage of model.outages) {
      byType[outage.type] = (byType[outage.type] ?? 0) + 1;
      outageRows.push({
        unit_id: unit.id,
        start_date: outage.startDate,
        end_date: outage.endDate,
        duration_days: outage.durationDays,
        type: outage.type,
        classification_score: outage.score,
        classification_signals: outage.signals,
        is_extended: outage.isExtended,
        is_current: outage.endDate === null && model.state !== 'restarting',
      });
    }

    if (model.forecast) {
      forecastRows.push({
        unit_id: unit.id,
        forecast_start: model.forecast.forecastStart,
        window_start: model.forecast.windowStart,
        window_end: model.forecast.windowEnd,
        forecast_duration_days: model.forecast.durationDays,
        confidence: model.forecast.confidence,
        basis: model.forecast.basis,
      });
    }

    const hasCurrent = model.outages.some((outage) => outage.endDate === null) && model.state !== 'restarting';
    if (!hasCurrent && !model.forecast) missingBoth.push(unit.nrc_name);
  }

  const ids = await replaceOutages(outageRows);
  await replaceForecasts(forecastRows);

  const stateRows: UnitStateWrite[] = pendingStates.map(({ unit, model }) => {
    const current = model.current && model.state !== 'restarting' ? model.current : null;
    const outageId = current ? ids.get(`${unit.id}|${current.startDate}`) ?? null : null;
    return {
      unit_id: unit.id,
      state: model.state,
      state_since: model.stateSince,
      power_pct: model.power,
      day_of_outage: outageId ? model.dayOfOutage : null,
      report_date: model.reportDate,
      outage_id: outageId,
      expected_return: model.state === 'refueling_outage' ? model.expectedReturn : null,
    };
  });
  await upsertUnitStates(stateRows);

  return {
    asOf,
    outages: outageRows.length,
    forecasts: forecastRows.length,
    byType,
    byState,
    missingBoth,
    fixtures: fixtureLines(units, pendingStates),
    comments: [...comments.entries()]
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
      .slice(0, 40),
  };
}

async function loadPoints(
  db: SupabaseClient,
  unitIds: Set<string>,
): Promise<Map<string, StatusPoint[]>> {
  const points = new Map<string, StatusPoint[]>();
  const ids = [...unitIds];
  let loaded = 0;
  for (const unitId of ids) {
    const series: StatusPoint[] = [];
    let after = '1990-01-01';
    for (;;) {
      const { data, error } = await db
        .from('unit_daily_status')
        .select('report_date, power_pct, reason_comment, scrams')
        .eq('unit_id', unitId)
        .gt('report_date', after)
        .order('report_date', { ascending: true })
        .limit(PAGE);
      if (error) throw new Error(error.message);
      const rows = data ?? [];
      for (const row of rows) {
        series.push({
          reportDate: row.report_date,
          power: row.power_pct,
          reasonComment: row.reason_comment,
          scrams: row.scrams,
        });
        after = row.report_date;
      }
      loaded += rows.length;
      if (rows.length < PAGE) break;
    }
    points.set(unitId, series);
    if (points.size % 16 === 0) console.log(`loaded ${loaded} daily rows across ${points.size} units`);
  }
  return points;
}

function fleetAsOf(points: Map<string, StatusPoint[]>, units: StoredUnit[]): string {
  let latest = '1999-01-01';
  for (const unit of units) {
    if (unit.status_override === 'restarting') continue;
    const series = points.get(unit.id);
    const last = series?.[series.length - 1]?.reportDate;
    if (last && last > latest) latest = last;
  }
  return latest;
}

function fixtureLines(
  units: StoredUnit[],
  pending: { unit: StoredUnit; model: ReturnType<typeof modelUnit> }[],
): string[] {
  const byName = new Map(pending.map((row) => [row.unit.nrc_name, row.model]));
  const lines: string[] = [];

  function outageAround(name: string, startMin: string, startMax: string) {
    const model = byName.get(name);
    const match = model?.outages.find(
      (outage) => outage.startDate >= startMin && outage.startDate <= startMax,
    );
    return { model, match };
  }

  const fitz = outageAround('FitzPatrick', '2026-09-01', '2026-09-14');
  lines.push(
    check(
      'FitzPatrick refueling ending 2026-10-04',
      fitz.match?.type === 'refueling' && fitz.match.endDate === '2026-10-04',
      fitz.match,
    ),
  );

  const mcguire = byName.get('McGuire 1')?.outages.find((outage) => outage.endDate === '2026-10-04');
  lines.push(check('McGuire 1 refueling ending 2026-10-04', mcguire?.type === 'refueling', mcguire));

  const browns = byName
    .get('Browns Ferry 1')
    ?.outages.find((outage) => outage.endDate === '2026-10-10');
  lines.push(check('Browns Ferry 1 refueling ending 2026-10-10', browns?.type === 'refueling', browns));

  for (const name of ['North Anna 2', 'Vogtle 2'] as const) {
    const model = byName.get(name);
    const open = model?.outages.find(
      (outage) => outage.startDate <= '2026-10-16' && (outage.endDate === null || outage.endDate > '2026-10-16'),
    );
    lines.push(check(`${name} refueling through 2026-10-16`, open?.type === 'refueling', open));
  }

  const cooper = byName.get('Cooper')?.outages.find((outage) => outage.startDate === '2026-09-28');
  lines.push(
    check(
      'Cooper refueling from 2026-09-28',
      cooper?.type === 'refueling' && (cooper.endDate === null || cooper.endDate > '2026-10-16'),
      cooper,
    ),
  );

  const hatch = byName.get('Hatch 1')?.outages.find((outage) => outage.startDate === '2026-10-11');
  lines.push(check('Hatch 1 mid-October outage is not refueling', hatch?.type !== 'refueling', hatch));

  const palisades = byName.get('Palisades');
  lines.push(check('Palisades restarting', palisades?.state === 'restarting', palisades?.state));

  void units;
  return lines;
}

function check(label: string, ok: boolean, detail: unknown): string {
  const extra = detail ? ` ${JSON.stringify(detail).slice(0, 220)}` : '';
  return `${ok ? 'PASS' : 'FAIL'} ${label}${ok ? '' : extra}`;
}
