import {
  COASTDOWN_MAX_INCREASE,
  COASTDOWN_MIN_SMALL_DECLINES,
  COASTDOWN_POWER_MAX,
  COASTDOWN_POWER_MIN,
  COASTDOWN_SMALL_DECLINE_MAX,
  COASTDOWN_SMALL_DECLINE_MIN,
  COASTDOWN_WINDOW_DAYS,
  EXTENDED_SHUTDOWN_DAYS,
  FULL_POWER_MIN_PCT,
} from './config';

/**
 * Power-only unit state. Later phases insert coastdown, refueling, and
 * extended shutdown ahead of `reduced`, in the same priority order.
 */
export type UnitState =
  | 'restarting'
  | 'extended_shutdown'
  | 'refueling_outage'
  | 'unplanned'
  | 'maintenance'
  | 'offline'
  | 'coastdown'
  | 'reduced'
  | 'full'
  | 'unknown';

export interface UnitSnapshot {
  nrcName: string;
  power: number | null;
  state: UnitState;
}

export interface UnitStateCounts {
  full: number;
  reduced: number;
  coastdown: number;
  offline: number;
  unplanned: number;
  maintenance: number;
  refueling_outage: number;
  extended_shutdown: number;
  restarting: number;
  unknown: number;
}

const PRIORITY: UnitState[] = [
  'restarting',
  'extended_shutdown',
  'refueling_outage',
  'unplanned',
  'maintenance',
  'offline',
  'coastdown',
  'reduced',
  'full',
  'unknown',
];

export function unitPowerState(power: number | null, restarting: boolean): UnitState {
  if (restarting) return 'restarting';
  if (power === null || Number.isNaN(power)) return 'unknown';
  if (power <= 0) return 'offline';
  if (power >= FULL_POWER_MIN_PCT) return 'full';
  return 'reduced';
}

/** Values allowed by the unit_state check constraint. */
export type DbUnitState =
  | 'restarting'
  | 'extended_shutdown'
  | 'refueling_outage'
  | 'unplanned_outage'
  | 'coastdown'
  | 'reduced'
  | 'full_power'
  | 'unknown';

export interface HistoryPoint {
  reportDate: string;
  power: number;
  reasonComment?: string | null;
}

export interface ClassifiedState {
  state: DbUnitState;
  stateSince: string | null;
  power: number | null;
  reportDate: string | null;
  dayOfOutage: number | null;
}

const COMMENT_LOOKBACK_DAYS = 45;

function calendarDays(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number);
  const [endYear, endMonth, endDay] = end.split('-').map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((endUtc - startUtc) / 86_400_000);
}

function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Last 10 powers, oldest first. A drop larger than 4 points is allowed and
 * does not count as one of the small declines. An increase above 2 points fails.
 */
export function isCoastdown(powers: number[]): boolean {
  if (powers.length < COASTDOWN_WINDOW_DAYS) return false;
  const window = powers.slice(-COASTDOWN_WINDOW_DAYS);
  const current = window[window.length - 1];
  if (current < COASTDOWN_POWER_MIN || current > COASTDOWN_POWER_MAX) return false;

  let declines = 0;
  for (let i = 1; i < window.length; i++) {
    const step = window[i] - window[i - 1];
    if (step > COASTDOWN_MAX_INCREASE) return false;
    if (step <= -COASTDOWN_SMALL_DECLINE_MIN && step >= -COASTDOWN_SMALL_DECLINE_MAX) {
      declines += 1;
    }
  }
  return declines >= COASTDOWN_MIN_SMALL_DECLINES;
}

/**
 * Current state from recent power history. Refueling vs unplanned waits for
 * outage classification, so a short zero run stays `unplanned_outage`.
 * Restarting beats a long zero run.
 */
export function classifyHistory(
  points: HistoryPoint[],
  statusOverride: string | null,
): ClassifiedState {
  const sorted = [...points].sort((a, b) => a.reportDate.localeCompare(b.reportDate));
  if (sorted.length === 0) {
    if (statusOverride === 'restarting') {
      return {
        state: 'restarting',
        stateSince: null,
        power: null,
        reportDate: null,
        dayOfOutage: null,
      };
    }
    return {
      state: 'unknown',
      stateSince: null,
      power: null,
      reportDate: null,
      dayOfOutage: null,
    };
  }

  const latest = sorted[sorted.length - 1];
  const commentCutoff = shiftIsoDate(latest.reportDate, -COMMENT_LOOKBACK_DAYS);
  let latestComment = '';
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].reportDate < commentCutoff) break;
    const comment = sorted[i].reasonComment;
    if (comment) {
      latestComment = comment;
      break;
    }
  }

  const power = latest.power;
  const current = {
    power,
    reportDate: latest.reportDate,
    stateSince: latest.reportDate,
    dayOfOutage: null as number | null,
  };

  const restarting =
    statusOverride === 'restarting' ||
    (/plant restart/i.test(latestComment) && power < FULL_POWER_MIN_PCT);
  if (restarting) return { ...current, state: 'restarting' };

  if (power <= 0) {
    let start = latest.reportDate;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].power > 0) break;
      start = sorted[i].reportDate;
    }
    const span = calendarDays(start, latest.reportDate);
    const dayOfOutage = span + 1;
    if (span > EXTENDED_SHUTDOWN_DAYS) {
      return {
        ...current,
        state: 'extended_shutdown',
        stateSince: start,
        dayOfOutage,
      };
    }
    return {
      ...current,
      state: 'unplanned_outage',
      stateSince: start,
      dayOfOutage,
    };
  }

  const recentPowers = sorted.slice(-COASTDOWN_WINDOW_DAYS).map((point) => point.power);
  const commentCoastdown =
    /coastdown to refueling/i.test(latestComment) &&
    power >= COASTDOWN_POWER_MIN &&
    power <= COASTDOWN_POWER_MAX;
  if (isCoastdown(recentPowers) || commentCoastdown) {
    return { ...current, state: 'coastdown' };
  }

  if (power < FULL_POWER_MIN_PCT) return { ...current, state: 'reduced' };
  return { ...current, state: 'full_power' };
}

export function unitsFromReport(
  units: { nrcName: string }[],
  nrcStatus: Record<string, number>,
  restarting: boolean,
): UnitSnapshot[] {
  return units.map((unit) => {
    const power = unit.nrcName in nrcStatus ? nrcStatus[unit.nrcName] : null;
    return {
      nrcName: unit.nrcName,
      power,
      state: unitPowerState(power, restarting),
    };
  });
}

export function dbStateToUi(state: DbUnitState, outageType?: string | null): UnitState {
  if (state === 'full_power') return 'full';
  if (state === 'unplanned_outage') {
    if (outageType === 'unplanned') return 'unplanned';
    if (outageType === 'maintenance') return 'maintenance';
    return 'offline';
  }
  return state;
}

export function highestUnitState(states: UnitState[]): UnitState {
  for (const state of PRIORITY) {
    if (states.includes(state)) return state;
  }
  return 'unknown';
}

export function countUnitStates(states: UnitState[]): UnitStateCounts {
  const counts: UnitStateCounts = {
    full: 0,
    reduced: 0,
    coastdown: 0,
    offline: 0,
    unplanned: 0,
    maintenance: 0,
    refueling_outage: 0,
    extended_shutdown: 0,
    restarting: 0,
    unknown: 0,
  };
  for (const state of states) counts[state] += 1;
  return counts;
}

function unitNumber(nrcName: string): string | null {
  const match = nrcName.match(/\s(\d+)$/);
  return match?.[1] ?? null;
}

function stateWord(state: UnitState): string {
  switch (state) {
    case 'offline':
      return 'offline';
    case 'unplanned':
      return 'offline (unplanned)';
    case 'maintenance':
      return 'offline for maintenance';
    case 'reduced':
      return 'reduced';
    case 'full':
      return 'at full power';
    case 'restarting':
      return 'restarting';
    case 'extended_shutdown':
      return 'in extended shutdown';
    case 'refueling_outage':
      return 'in refueling outage';
    case 'coastdown':
      return 'coasting down to refueling';
    default:
      return 'with no data';
  }
}

/**
 * Highest-priority unit state, with a count. Never an average of the plant.
 * "Unit 2 offline", "2 of 3 units reduced", "All units at full power".
 */
export function plantRollupLabel(units: UnitSnapshot[]): string {
  if (units.length === 0) return 'No data';

  const top = highestUnitState(units.map((unit) => unit.state));
  if (top === 'unknown') return 'No data';

  const matching = units.filter((unit) => unit.state === top);
  const word = stateWord(top);

  if (matching.length === units.length) {
    if (units.length === 1) {
      const number = unitNumber(units[0].nrcName);
      if (top === 'full') return 'Full power';
      if (top === 'restarting') return 'Restarting';
      if (number) return `Unit ${number} ${word}`;
      if (top === 'offline') return 'Offline';
      if (top === 'reduced') return 'Reduced';
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    if (top === 'full') return 'All units at full power';
    return `All units ${word}`;
  }

  if (matching.length === 1) {
    const number = unitNumber(matching[0].nrcName);
    if (number) return `Unit ${number} ${word}`;
  }

  const noun = matching.length === 1 ? 'unit' : 'units';
  return `${matching.length} of ${units.length} ${noun} ${word}`;
}
