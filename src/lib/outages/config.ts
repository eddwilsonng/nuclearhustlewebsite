/** Thresholds and source URLs for fleet status. Later phases add cycle and forecast constants here. */

/** At or above this, a unit is at full power. Below it, and above 0, the unit is reduced. */
export const FULL_POWER_MIN_PCT = 95;

export const NRC_POWER_STATUS_URL =
  'https://www.nrc.gov/documents-reports/document-collections/events-reports-associated-with/power-reactor-status-reports/PowerReactorStatusForLast365Days.txt';

export const NRC_USER_AGENT = 'NuclearHustle/1.0 (+https://www.nuclearhustle.com)';

export const NRC_REPORTS_BASE =
  'https://www.nrc.gov/documents-reports/document-collections/events-reports-associated-with/power-reactor-status-reports';

export const NRC_MIN_INTERVAL_MS = 2000;
export const NRC_YEAR_START = 1999;
export const NRC_COMMENT_LOOKBACK_YEARS = 5;
export const EXTENDED_SHUTDOWN_DAYS = 180;

/** Last 10 report days, at least this many steps of 1 to 4 points down. */
export const COASTDOWN_WINDOW_DAYS = 10;
export const COASTDOWN_MIN_SMALL_DECLINES = 6;
export const COASTDOWN_SMALL_DECLINE_MIN = 1;
export const COASTDOWN_SMALL_DECLINE_MAX = 4;
export const COASTDOWN_MAX_INCREASE = 2;
export const COASTDOWN_POWER_MIN = 50;
export const COASTDOWN_POWER_MAX = 99;

/** Report-date holes this short stay inside one outage. */
export const OUTAGE_GAP_DAYS = 3;
/** A short return below this power is a failed startup, not the end of the outage. */
export const FAILED_START_MAX_POWER = 30;
export const FAILED_START_MAX_DAYS = 3;
export const OUTAGE_EXTENDED_DAYS = 90;

export const REFUEL_COMMENT_LOOKBACK_DAYS = 45;
export const COASTDOWN_LOOKBACK_DAYS = 30;
export const REFUEL_SCORE_MIN = 4;
export const SHORT_OUTAGE_DAYS = 10;
export const UNPLANNED_DURATION_DAYS = 14;
export const TYPICAL_DURATION_MIN_DAYS = 14;
export const TYPICAL_DURATION_MAX_DAYS = 90;

/** 15 to 26 months, using a 30.4375-day month. */
export const CYCLE_GAP_MIN_DAYS = Math.round(15 * 30.4375);
export const CYCLE_GAP_MAX_DAYS = Math.round(26 * 30.4375);
export const DEFAULT_CYCLE_DAYS = 548;
export const DEFAULT_REFUEL_DURATION_DAYS = 30;
export const FORECAST_WINDOW_MIN_DAYS = 21;
export const FORECAST_DUE_NOW_DAYS = 90;
export const FORECAST_HISTORY_STARTS = 5;
export const FORECAST_HISTORY_DURATIONS = 3;

/** Jobs within this distance count as near a plant. Used in phase 3. */
export const JOBS_NEAR_MILES = 100;

export function nrcYearUrl(year: number): string {
  return `${NRC_REPORTS_BASE}/${year}/${year}PowerStatus.txt`;
}

/** date is YYYY-MM-DD. */
export function nrcDailyUrl(date: string): string {
  const [year, month, day] = date.split('-');
  return `${NRC_REPORTS_BASE}/${year}/${year}${month}${day}ps`;
}
