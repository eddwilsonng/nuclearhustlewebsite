import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyOutages } from './classify';
import { detectOutages, type StatusPoint } from './detect';
import { forecastNextRefueling } from './forecast';
import { modelUnit } from './model';

function zeros(start: string, days: number, comment?: string): StatusPoint[] {
  const points: StatusPoint[] = [];
  const [year, month, day] = start.split('-').map(Number);
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(Date.UTC(year, month - 1, day + offset));
    points.push({
      reportDate: date.toISOString().slice(0, 10),
      power: 0,
      reasonComment: offset === 0 ? comment ?? null : null,
    });
  }
  return points;
}

function day(date: string, power: number, comment?: string): StatusPoint {
  return { reportDate: date, power, reasonComment: comment ?? null };
}

describe('detectOutages', () => {
  it('treats a 2-day hole as one outage and ends on the first positive power', () => {
    const runs = detectOutages(
      [day('2026-09-01', 0), day('2026-09-04', 0), day('2026-09-05', 40)],
      '2026-09-05',
    );
    assert.equal(runs.length, 1);
    assert.equal(runs[0].startDate, '2026-09-01');
    assert.equal(runs[0].endDate, '2026-09-05');
  });

  it('splits a hole longer than 3 days', () => {
    const runs = detectOutages(
      [day('2026-09-01', 0), day('2026-09-06', 0), day('2026-09-07', 100)],
      '2026-09-07',
    );
    assert.equal(runs.length, 2);
    assert.equal(runs[0].endDate, '2026-09-02');
    assert.equal(runs[1].startDate, '2026-09-06');
  });

  it('merges a failed startup below 30% for 3 days', () => {
    const runs = detectOutages(
      [
        ...zeros('2026-09-01', 5),
        day('2026-09-06', 20),
        day('2026-09-07', 15),
        ...zeros('2026-09-08', 4),
        day('2026-09-12', 100),
      ],
      '2026-09-12',
    );
    assert.equal(runs.length, 1);
    assert.equal(runs[0].startDate, '2026-09-01');
    assert.equal(runs[0].endDate, '2026-09-12');
  });

  it('leaves an open outage while the latest report is still at 0', () => {
    const runs = detectOutages(zeros('2026-10-01', 5), '2026-10-05');
    assert.equal(runs[0].endDate, null);
    assert.equal(runs[0].durationDays, 5);
  });
});

describe('classifyOutages', () => {
  it('does not call a 3-day October outage a refueling', () => {
    const points = [...zeros('2026-10-11', 3), day('2026-10-14', 3), day('2026-10-15', 100)];
    const [outage] = classifyOutages(detectOutages(points, '2026-10-15'), points);
    assert.notEqual(outage.type, 'refueling');
    assert.equal(outage.durationDays, 3);
  });

  it('calls a commented, coasted, in-season outage a refueling', () => {
    const decline = [100, 98, 97, 96, 95, 94, 93, 92, 91, 90].map((power, index) =>
      day(`2026-08-${String(index + 20).padStart(2, '0')}`, power, index === 9 ? 'Coastdown to Refueling Outage' : undefined),
    );
    const points = [...decline, ...zeros('2026-09-01', 30, 'Refueling outage'), day('2026-10-01', 100)];
    const [outage] = classifyOutages(detectOutages(points, '2026-10-01'), points);
    assert.equal(outage.type, 'refueling');
    assert.ok(outage.score >= 4);
  });

  it('uses the first-pass refueling dates for the cycle signal', () => {
    const one = [...zeros('2024-04-01', 25, 'Refueling'), day('2024-04-26', 100)];
    const two = [...zeros('2026-04-01', 25, 'Refueling'), day('2026-04-26', 100)];
    const points = [...one, ...two];
    const outages = classifyOutages(detectOutages(points, '2026-04-26'), points);
    assert.equal(outages[1].type, 'refueling');
    assert.equal(outages[1].signals.cycleGap, 2);
  });

  it('labels a maintenance comment that is not a refueling', () => {
    const points = [...zeros('2026-06-01', 12, 'Maintenance'), day('2026-06-13', 100)];
    const [outage] = classifyOutages(detectOutages(points, '2026-06-13'), points);
    assert.equal(outage.type, 'maintenance');
  });

  it('does not penalise a short outage that is still open', () => {
    const earlier = [...zeros('2025-04-01', 25, 'Refueling'), day('2025-04-26', 100)];
    const points = [...earlier, ...zeros('2026-10-17', 3)];
    const outages = classifyOutages(detectOutages(points, '2026-10-19'), points);
    const open = outages.find((outage) => outage.endDate === null);
    assert.equal(open?.type, 'refueling');
    assert.equal(open?.signals.short, undefined);
    assert.equal(open?.signals.cycleGap, 2);
  });

  it('pulls an older outage in from the next refueling', () => {
    const older = [...zeros('2024-03-01', 20), day('2024-03-21', 100)];
    const newer = [...zeros('2025-09-01', 20, 'Refueling'), day('2025-09-21', 100)];
    const outages = classifyOutages(detectOutages([...older, ...newer], '2025-09-21'), [...older, ...newer]);
    assert.equal(outages[0].type, 'refueling');
    assert.equal(outages[0].signals.cycleGap, 2);
  });

  it('does not let an earlier forced outage cancel the refueling', () => {
    const forced = [...zeros('2025-03-20', 3, 'Forced Outage'), day('2025-03-23', 95, 'Coastdown to Refueling Outage')];
    const refueling = [...zeros('2025-04-19', 30, 'Refueling Outage'), day('2025-05-19', 100)];
    const outages = classifyOutages(detectOutages([...forced, ...refueling], '2025-05-19'), [...forced, ...refueling]);
    assert.equal(outages[0].signals.trip, -3);
    assert.equal(outages[1].type, 'refueling');
    assert.equal(outages[1].signals.trip, undefined);
  });

  it('treats a forced outage comment as a trip', () => {
    const points = [...zeros('2026-06-01', 8, 'Forced Outage'), day('2026-06-09', 100)];
    const [outage] = classifyOutages(detectOutages(points, '2026-06-09'), points);
    assert.equal(outage.signals.trip, -3);
    assert.notEqual(outage.type, 'refueling');
  });
});

describe('forecastNextRefueling', () => {
  it('never returns a start date before today', () => {
    const points = [...zeros('2024-01-01', 20, 'Refueling'), day('2024-01-21', 100)];
    const outages = classifyOutages(detectOutages(points, '2026-10-20'), points);
    const forecast = forecastNextRefueling(outages, '2026-10-20', false);
    assert.ok(forecast);
    assert.ok(forecast.forecastStart >= '2026-10-20');
    assert.ok(forecast.windowStart <= forecast.forecastStart);
    assert.ok(forecast.forecastStart <= forecast.windowEnd);
  });

  it('uses a single measured interval instead of 18 months', () => {
    const first = [...zeros('2023-02-01', 20, 'Refueling'), day('2023-02-21', 100)];
    const second = [...zeros('2025-02-01', 20, 'Refueling'), day('2025-02-21', 100)];
    const outages = classifyOutages(detectOutages([...first, ...second], '2026-10-20'), [...first, ...second]);
    const forecast = forecastNextRefueling(outages, '2026-10-20', false);
    assert.equal(forecast?.basis.lowSample, false);
    assert.equal(forecast?.basis.intervalsUsed, 1);
    assert.ok((forecast?.basis.cycleDays as number) > 700);
    assert.equal(forecast?.dueNow, false);
    assert.ok((forecast?.forecastStart ?? '') > '2026-10-20');
  });

  it('marks a forecast up to 90 days late as due now', () => {
    const points = [...zeros('2025-01-01', 20, 'Refueling'), day('2025-01-21', 100)];
    const outages = classifyOutages(detectOutages(points, '2026-07-15'), points);
    const forecast = forecastNextRefueling(outages, '2026-07-15', false);
    assert.equal(forecast?.dueNow, true);
    assert.equal(forecast?.forecastStart, '2026-07-15');
  });
});

describe('modelUnit', () => {
  it('keeps a restarting unit out of the outage list even at 0%', () => {
    const points = zeros('2025-09-09', 400);
    const model = modelUnit(points, '2026-10-20', 'restarting');
    assert.equal(model.state, 'restarting');
    assert.equal(model.dayOfOutage, null);
  });
});
