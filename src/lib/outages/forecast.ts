import {
  DEFAULT_CYCLE_DAYS,
  DEFAULT_REFUEL_DURATION_DAYS,
  FORECAST_DUE_NOW_DAYS,
  FORECAST_HISTORY_DURATIONS,
  FORECAST_HISTORY_STARTS,
  FORECAST_WINDOW_MIN_DAYS,
} from './config';
import { calendarDays, median, medianAbsoluteDeviation, shiftIsoDate } from './dates';
import type { ClassifiedOutage } from './classify';

export type ForecastConfidence = 'forecast' | 'isi_letter' | 'coastdown' | 'started';

export interface RefuelForecast {
  forecastStart: string;
  windowStart: string;
  windowEnd: string;
  durationDays: number;
  confidence: ForecastConfidence;
  basis: Record<string, unknown>;
  dueNow: boolean;
}

export function forecastNextRefueling(
  refuelings: ClassifiedOutage[],
  asOf: string,
  coastdown: boolean,
): RefuelForecast | null {
  const starts = refuelings
    .filter((outage) => outage.type === 'refueling')
    .map((outage) => outage.startDate)
    .sort();
  if (starts.length === 0) return null;

  const recentStarts = starts.slice(-FORECAST_HISTORY_STARTS);
  const intervals: number[] = [];
  for (let index = 1; index < recentStarts.length; index += 1) {
    intervals.push(calendarDays(recentStarts[index - 1], recentStarts[index]));
  }

  const lowSample = intervals.length === 0;
  const cycleDays = lowSample ? DEFAULT_CYCLE_DAYS : median(intervals);
  const lastStart = starts[starts.length - 1];
  let computed = shiftIsoDate(lastStart, cycleDays);
  const basis: Record<string, unknown> = {
    cycleDays,
    lastRefuelingStart: lastStart,
    intervalsUsed: intervals.length,
    lowSample,
  };

  let dueNow = false;
  if (computed < asOf) {
    const lateDays = calendarDays(computed, asOf);
    if (lateDays <= FORECAST_DUE_NOW_DAYS) {
      dueNow = true;
      basis.computedStart = computed;
      basis.dueNow = true;
      computed = asOf;
    } else {
      let rolls = 0;
      while (computed < asOf) {
        computed = shiftIsoDate(computed, cycleDays);
        rolls += 1;
      }
      basis.rolledCycles = rolls;
    }
  }

  const pad = Math.max(
    FORECAST_WINDOW_MIN_DAYS,
    lowSample ? 0 : medianAbsoluteDeviation(intervals),
  );
  const durationSamples = refuelings
    .filter((outage) => outage.type === 'refueling' && outage.endDate)
    .slice(-FORECAST_HISTORY_DURATIONS)
    .map((outage) => outage.durationDays);
  const durationDays =
    durationSamples.length > 0 ? median(durationSamples) : DEFAULT_REFUEL_DURATION_DAYS;
  basis.durationSample = durationSamples.length;

  return {
    forecastStart: computed,
    windowStart: shiftIsoDate(computed, -pad),
    windowEnd: shiftIsoDate(computed, pad),
    durationDays,
    confidence: coastdown ? 'coastdown' : 'forecast',
    basis,
    dueNow,
  };
}
