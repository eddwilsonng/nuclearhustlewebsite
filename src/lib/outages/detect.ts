import { FAILED_START_MAX_DAYS, FAILED_START_MAX_POWER, OUTAGE_GAP_DAYS } from './config';
import { calendarDays, shiftIsoDate } from './dates';

export interface StatusPoint {
  reportDate: string;
  power: number;
  reasonComment?: string | null;
  scrams?: number | null;
}

export interface OutageRun {
  startDate: string;
  /** First report date after the run with power above 0. Null while the unit is still at 0. */
  endDate: string | null;
  /** Days from the start through the day before the return, or through `asOf` if it is still down. */
  durationDays: number;
}

function prepare(points: StatusPoint[]): StatusPoint[] {
  const byDate = new Map<string, StatusPoint>();
  for (const point of points) byDate.set(point.reportDate, point);
  return [...byDate.values()].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
}

function duration(startDate: string, endDate: string | null, asOf: string): number {
  if (!endDate) return calendarDays(startDate, asOf) + 1;
  return Math.max(calendarDays(startDate, endDate), 0);
}

/**
 * A zero-power run. Report holes of up to 3 days stay in the same outage.
 * A return below 30% for 3 days or fewer is a failed startup and stays in the outage.
 */
export function detectOutages(points: StatusPoint[], asOf: string): OutageRun[] {
  const series = prepare(points);
  const runs: OutageRun[] = [];
  let index = 0;

  while (index < series.length) {
    if (series[index].power > 0) {
      index += 1;
      continue;
    }

    const startDate = series[index].reportDate;
    let last = index;
    while (last + 1 < series.length) {
      const next = series[last + 1];
      const gap = calendarDays(series[last].reportDate, next.reportDate);
      if (next.power === 0 && gap <= OUTAGE_GAP_DAYS) {
        last += 1;
        continue;
      }
      break;
    }

    const following = series[last + 1];
    let endDate: string | null = null;
    if (!following) {
      const sinceLast = calendarDays(series[last].reportDate, asOf);
      endDate = sinceLast <= OUTAGE_GAP_DAYS ? null : shiftIsoDate(series[last].reportDate, 1);
    } else if (following.power > 0) {
      endDate = following.reportDate;
    } else {
      endDate = shiftIsoDate(series[last].reportDate, 1);
    }

    runs.push({ startDate, endDate, durationDays: duration(startDate, endDate, asOf) });
    index = last + 1;
  }

  return mergeFailedStarts(runs, series, asOf);
}

function mergeFailedStarts(runs: OutageRun[], series: StatusPoint[], asOf: string): OutageRun[] {
  if (runs.length === 0) return [];
  const merged: OutageRun[] = [{ ...runs[0] }];

  for (let index = 1; index < runs.length; index += 1) {
    const previous = merged[merged.length - 1];
    const next = runs[index];
    if (previous.endDate && isFailedStart(series, previous.endDate, next.startDate)) {
      merged[merged.length - 1] = {
        startDate: previous.startDate,
        endDate: next.endDate,
        durationDays: duration(previous.startDate, next.endDate, asOf),
      };
      continue;
    }
    merged.push({ ...next });
  }

  return merged;
}

function isFailedStart(series: StatusPoint[], returnDate: string, nextStart: string): boolean {
  const between = series.filter(
    (point) => point.reportDate >= returnDate && point.reportDate < nextStart && point.power > 0,
  );
  if (between.length === 0 || between.length > FAILED_START_MAX_DAYS) return false;
  return between.every((point) => point.power < FAILED_START_MAX_POWER);
}
