import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyHistory,
  countUnitStates,
  highestUnitState,
  isCoastdown,
  plantRollupLabel,
  unitPowerState,
  type HistoryPoint,
  type UnitSnapshot,
} from './unitState';

function units(
  rows: { nrcName: string; state: UnitSnapshot['state'] }[],
): UnitSnapshot[] {
  return rows.map((row) => ({ ...row, power: null }));
}

describe('unitPowerState', () => {
  it('uses the full-power threshold and the restarting override', () => {
    assert.equal(unitPowerState(100, false), 'full');
    assert.equal(unitPowerState(95, false), 'full');
    assert.equal(unitPowerState(94, false), 'reduced');
    assert.equal(unitPowerState(1, false), 'reduced');
    assert.equal(unitPowerState(0, false), 'offline');
    assert.equal(unitPowerState(null, false), 'unknown');
    assert.equal(unitPowerState(0, true), 'restarting');
    assert.equal(unitPowerState(null, true), 'restarting');
  });
});

describe('plantRollupLabel', () => {
  it('names the offline unit instead of the plant average', () => {
    assert.equal(
      plantRollupLabel(
        units([
          { nrcName: 'Peach Bottom 2', state: 'offline' },
          { nrcName: 'Peach Bottom 3', state: 'full' },
        ]),
      ),
      'Unit 2 offline',
    );
    assert.equal(
      highestUnitState(['full', 'offline']),
      'offline',
    );
  });

  it('counts every offline unit when more than one is down', () => {
    assert.equal(
      plantRollupLabel(
        units([
          { nrcName: 'Browns Ferry 1', state: 'offline' },
          { nrcName: 'Browns Ferry 2', state: 'offline' },
          { nrcName: 'Browns Ferry 3', state: 'full' },
        ]),
      ),
      '2 of 3 units offline',
    );
  });

  it('labels a fully operating plant without averaging', () => {
    assert.equal(
      plantRollupLabel(
        units([
          { nrcName: 'Vogtle 1', state: 'full' },
          { nrcName: 'Vogtle 2', state: 'full' },
        ]),
      ),
      'All units at full power',
    );
    assert.equal(
      plantRollupLabel(units([{ nrcName: 'Clinton', state: 'full' }])),
      'Full power',
    );
    assert.equal(
      plantRollupLabel(units([{ nrcName: 'Clinton', state: 'offline' }])),
      'Offline',
    );
  });

  it('names a unit that is coasting down', () => {
    assert.equal(
      plantRollupLabel(units([{ nrcName: 'Comanche Peak 1', state: 'coastdown' }])),
      'Unit 1 coasting down to refueling',
    );
  });

  it('keeps a restarting unit out of the offline bucket', () => {
    assert.equal(
      plantRollupLabel(units([{ nrcName: 'Palisades', state: 'restarting' }])),
      'Restarting',
    );
  });
});

function days(start: string, powers: number[], commentOnLast?: string): HistoryPoint[] {
  const [year, month, day] = start.split('-').map(Number);
  return powers.map((power, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index));
    return {
      reportDate: date.toISOString().slice(0, 10),
      power,
      reasonComment: index === powers.length - 1 ? commentOnLast ?? null : null,
    };
  });
}

describe('isCoastdown', () => {
  it('passes Comanche Peak 1 and Byron 2, and fails Waterford 3', () => {
    assert.equal(isCoastdown([100, 98, 98, 97, 96, 95, 94, 94, 93, 91]), true);
    assert.equal(isCoastdown([96, 95, 94, 93, 92, 91, 90, 89, 86, 72]), true);
    assert.equal(isCoastdown([97, 97, 97, 97, 97, 91, 97, 91, 91, 91]), false);
  });
});

describe('classifyHistory', () => {
  it('keeps a restarting override ahead of a long zero run', () => {
    const state = classifyHistory(
      [
        { reportDate: '2025-01-01', power: 0 },
        { reportDate: '2025-09-09', power: 0, reasonComment: 'Plant Restart' },
      ],
      'restarting',
    );
    assert.equal(state.state, 'restarting');
    assert.equal(state.power, 0);
  });

  it('marks a zero run longer than 180 days as extended shutdown', () => {
    const state = classifyHistory(
      [
        { reportDate: '2025-01-01', power: 0 },
        { reportDate: '2025-08-01', power: 0 },
      ],
      null,
    );
    assert.equal(state.state, 'extended_shutdown');
    assert.equal(state.stateSince, '2025-01-01');
  });

  it('leaves a short zero run unclassified as a refueling outage', () => {
    const state = classifyHistory(days('2026-10-01', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), null);
    assert.equal(state.state, 'unplanned_outage');
    assert.equal(state.dayOfOutage, 10);
  });

  it('classifies the coastdown fixtures and leaves Waterford reduced', () => {
    assert.equal(
      classifyHistory(days('2026-10-07', [100, 98, 98, 97, 96, 95, 94, 94, 93, 91]), null).state,
      'coastdown',
    );
    assert.equal(
      classifyHistory(days('2026-10-07', [96, 95, 94, 93, 92, 91, 90, 89, 86, 72]), null).state,
      'coastdown',
    );
    assert.equal(
      classifyHistory(days('2026-10-07', [97, 97, 97, 97, 97, 91, 97, 91, 91, 91]), null).state,
      'reduced',
    );
  });

  it('uses a recent Plant Restart comment when there is no override', () => {
    const state = classifyHistory(days('2026-10-19', [0], 'Plant Restart'), null);
    assert.equal(state.state, 'restarting');
  });
});

describe('countUnitStates', () => {
  it('counts units in the same buckets the list labels use', () => {
    const plant = units([
      { nrcName: 'Peach Bottom 2', state: 'offline' },
      { nrcName: 'Peach Bottom 3', state: 'full' },
    ]);
    const counts = countUnitStates([
      ...plant.map((unit) => unit.state),
      'reduced',
      'restarting',
    ]);
    assert.equal(plantRollupLabel(plant), 'Unit 2 offline');
    assert.deepEqual(counts, {
      full: 1,
      reduced: 1,
      coastdown: 0,
      offline: 1,
      unplanned: 0,
      maintenance: 0,
      refueling_outage: 0,
      extended_shutdown: 0,
      restarting: 1,
      unknown: 0,
    });
  });
});
