import {
  COASTDOWN_LOOKBACK_DAYS,
  CYCLE_GAP_MAX_DAYS,
  CYCLE_GAP_MIN_DAYS,
  OUTAGE_EXTENDED_DAYS,
  REFUEL_COMMENT_LOOKBACK_DAYS,
  REFUEL_SCORE_MIN,
  SHORT_OUTAGE_DAYS,
  TYPICAL_DURATION_MAX_DAYS,
  TYPICAL_DURATION_MIN_DAYS,
  UNPLANNED_DURATION_DAYS,
} from './config';
import { calendarDays, monthOf, shiftIsoDate } from './dates';
import type { OutageRun, StatusPoint } from './detect';
import { isCoastdown } from './unitState';

export type OutageType = 'refueling' | 'unplanned' | 'maintenance' | 'unknown';

export interface ClassifiedOutage extends OutageRun {
  type: OutageType;
  score: number;
  signals: Record<string, number | boolean | string>;
  isExtended: boolean;
}

const REFUEL = /refuel/i;
const MAINTENANCE = /maintenance/i;
const TRIP = /scram|reactor trip|turbine trip|manual trip|automatic trip|forced outage/i;

function pointsInRange(points: StatusPoint[], start: string, endInclusive: string): StatusPoint[] {
  return points.filter((point) => point.reportDate >= start && point.reportDate <= endInclusive);
}

function commentText(points: StatusPoint[]): string {
  return points
    .map((point) => point.reasonComment ?? '')
    .filter(Boolean)
    .join(' ');
}

function hadCoastdown(points: StatusPoint[], startDate: string): boolean {
  const from = shiftIsoDate(startDate, -COASTDOWN_LOOKBACK_DAYS);
  const powers = points
    .filter((point) => point.reportDate >= from && point.reportDate < startDate)
    .map((point) => point.power);
  if (powers.length < 10) return false;
  for (let index = 0; index <= powers.length - 10; index += 1) {
    if (isCoastdown(powers.slice(index, index + 10))) return true;
  }
  return false;
}

function seasonPoint(startDate: string): boolean {
  const month = monthOf(startDate);
  return (month >= 2 && month <= 5) || (month >= 9 && month <= 11);
}

function cycleGapMatches(earlier: string, later: string): boolean {
  const gap = calendarDays(earlier, later);
  return gap >= CYCLE_GAP_MIN_DAYS && gap <= CYCLE_GAP_MAX_DAYS;
}

export function scoreOutage(
  run: OutageRun,
  points: StatusPoint[],
  previousRefuelingStart: string | null,
  nextRefuelingStart: string | null = null,
): { score: number; signals: Record<string, number | boolean | string> } {
  const windowStart = shiftIsoDate(run.startDate, -REFUEL_COMMENT_LOOKBACK_DAYS);
  const windowEnd = run.endDate ? shiftIsoDate(run.endDate, -1) : '9999-12-31';
  const comments = commentText(pointsInRange(points, windowStart, windowEnd));
  const during = commentText(pointsInRange(points, run.startDate, windowEnd));
  const startPoint = points.find((point) => point.reportDate === run.startDate);
  const signals: Record<string, number | boolean | string> = {};
  let score = 0;

  if (REFUEL.test(comments)) {
    score += 3;
    signals.refuelingComment = 3;
  }
  if (hadCoastdown(points, run.startDate)) {
    score += 2;
    signals.coastdown = 2;
  }
  const previousGap = previousRefuelingStart
    ? cycleGapMatches(previousRefuelingStart, run.startDate)
    : false;
  const nextGap = nextRefuelingStart ? cycleGapMatches(run.startDate, nextRefuelingStart) : false;
  if (previousGap || nextGap) {
    score += 2;
    signals.cycleGap = 2;
  }
  if (seasonPoint(run.startDate)) {
    score += 1;
    signals.season = 1;
  }
  if (run.durationDays >= TYPICAL_DURATION_MIN_DAYS && run.durationDays <= TYPICAL_DURATION_MAX_DAYS) {
    score += 1;
    signals.duration = 1;
  }
  if ((startPoint?.scrams ?? 0) > 0 || TRIP.test(during)) {
    score -= 3;
    signals.trip = -3;
  }
  if (run.endDate && run.durationDays < SHORT_OUTAGE_DAYS) {
    score -= 2;
    signals.short = -2;
  }

  signals.maintenanceComment = MAINTENANCE.test(comments) && !REFUEL.test(comments);
  return { score, signals };
}

export function outageType(
  score: number,
  durationDays: number,
  maintenanceComment: boolean,
  open = false,
  cycleGap = false,
): OutageType {
  if (score >= REFUEL_SCORE_MIN) return 'refueling';
  if (open && cycleGap && score >= 3) return 'refueling';
  if (maintenanceComment) return 'maintenance';
  if (score <= 0 && durationDays < UNPLANNED_DURATION_DAYS) return 'unplanned';
  return 'unknown';
}

function sameStarts(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((start, index) => start === right[index]);
}

/**
 * The first pass has no cycle signal. Later passes use the previous and next
 * refueling, and keep going until that set stops changing. Comment-era
 * refuelings then pull in older outages that have no reason text.
 */
export function classifyOutages(runs: OutageRun[], points: StatusPoint[]): ClassifiedOutage[] {
  const sorted = [...runs].sort((a, b) => a.startDate.localeCompare(b.startDate));
  let refuelingStarts: string[] = [];
  let classified: ClassifiedOutage[] = [];

  for (let pass = 0; pass < 12; pass += 1) {
    classified = sorted.map((run) => {
      const previous = [...refuelingStarts].reverse().find((start) => start < run.startDate) ?? null;
      const next = refuelingStarts.find((start) => start > run.startDate) ?? null;
      const scored = scoreOutage(run, points, previous, next);
      const type = outageType(
        scored.score,
        run.durationDays,
        scored.signals.maintenanceComment === true,
        run.endDate === null,
        scored.signals.cycleGap === 2,
      );
      return {
        ...run,
        type,
        score: scored.score,
        signals: scored.signals,
        isExtended: run.durationDays > OUTAGE_EXTENDED_DAYS,
      };
    });
    const nextStarts = classified
      .filter((outage) => outage.type === 'refueling')
      .map((outage) => outage.startDate);
    if (sameStarts(refuelingStarts, nextStarts)) break;
    refuelingStarts = nextStarts;
  }

  return classified;
}
