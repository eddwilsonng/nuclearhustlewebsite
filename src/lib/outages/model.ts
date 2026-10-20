import { classifyOutages, type ClassifiedOutage } from './classify';
import { detectOutages, type StatusPoint } from './detect';
import { forecastNextRefueling, type RefuelForecast } from './forecast';
import { median } from './dates';
import { classifyHistory, type DbUnitState } from './unitState';

export interface UnitModel {
  outages: ClassifiedOutage[];
  current: ClassifiedOutage | null;
  forecast: RefuelForecast | null;
  state: DbUnitState;
  stateSince: string | null;
  power: number | null;
  reportDate: string | null;
  dayOfOutage: number | null;
  expectedReturn: string | null;
}

export function modelUnit(
  points: StatusPoint[],
  asOf: string,
  statusOverride: 'restarting' | null,
): UnitModel {
  const outages = classifyOutages(detectOutages(points, asOf), points);
  const current = outages.find((outage) => outage.endDate === null) ?? null;
  const history = classifyHistory(
    points.map((point) => ({
      reportDate: point.reportDate,
      power: point.power,
      reasonComment: point.reasonComment,
    })),
    statusOverride,
  );
  let state = history.state;
  if (state === 'unplanned_outage' && current?.type === 'refueling') state = 'refueling_outage';

  const inRefueling = state === 'refueling_outage';
  const forecast = inRefueling
    ? null
    : forecastNextRefueling(outages, asOf, state === 'coastdown');

  const typicalDuration = medianRefuelDuration(outages);
  const expectedReturn =
    inRefueling && current ? shiftReturn(current.startDate, typicalDuration) : null;

  return {
    outages,
    current,
    forecast,
    state,
    stateSince: history.stateSince,
    power: history.power,
    reportDate: history.reportDate,
    dayOfOutage: current && state !== 'restarting' && state !== 'full_power' ? history.dayOfOutage : null,
    expectedReturn,
  };
}

function medianRefuelDuration(outages: ClassifiedOutage[]): number {
  const durations = outages
    .filter((outage) => outage.type === 'refueling' && outage.endDate)
    .slice(-3)
    .map((outage) => outage.durationDays);
  if (durations.length === 0) return 30;
  return median(durations);
}

function shiftReturn(startDate: string, days: number): string {
  const [year, month, day] = startDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
