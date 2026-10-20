import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dailyPageHasReasonColumn, parseDailyReportPage, parseNrcReportDate, parsePowerStatusFile } from './nrcParse';

describe('parsePowerStatusFile', () => {
  it('trims padded historical names and single-digit dates', () => {
    const text = [
      'ReportDt|Unit|Power',
      '9/30/1999 12:00:00 AM|Arkansas Nuclear 1                      |100',
      '10/1/1999 12:00:00 AM|Saint Lucie 2|0',
      '',
    ].join('\n');
    assert.deepEqual(parsePowerStatusFile(text), [
      { reportDate: '1999-09-30', unit: 'Arkansas Nuclear 1', power: 100 },
      { reportDate: '1999-10-01', unit: 'Saint Lucie 2', power: 0 },
    ]);
  });

  it('rejects an access-denied HTML page', () => {
    assert.throws(() => parsePowerStatusFile('<HTML><HEAD><TITLE>Access Denied</TITLE>'));
  });
});

describe('parseNrcReportDate', () => {
  it('parses the NRC timestamp', () => {
    assert.equal(parseNrcReportDate('10/19/2026 12:00:00 AM'), '2026-10-19');
    assert.equal(parseNrcReportDate('not a date'), null);
  });
});

describe('parseDailyReportPage', () => {
  it('reads the full column set, including a restart comment', () => {
    const html = `
      <table>
        <tr><th>Unit</th><th>Power</th><th>Down</th><th>Reason or Comment</th><th>Change in Report (*)</th><th>Scrams (#)</th></tr>
        <tr><td>FitzPatrick</td><td>86</td><td></td><td>Coastdown to Refueling Outage</td><td></td><td></td></tr>
        <tr><td>Palisades</td><td>0</td><td>2025-09-09</td><td>Plant Restart</td><td>*</td><td></td></tr>
      </table>
      <table>
        <tr><th>Unit</th><th>Power</th><th>Down</th><th>Reason or Comment</th><th>Change in Report (*)</th><th>Scrams (#)</th></tr>
        <tr><td>McGuire 1</td><td>94</td><td></td><td>Coastdown to Refueling Outage</td><td></td><td>1</td></tr>
      </table>
    `;
    assert.deepEqual(parseDailyReportPage(html), [
      {
        unit: 'FitzPatrick',
        power: 86,
        downDate: null,
        reasonComment: 'Coastdown to Refueling Outage',
        scrams: null,
      },
      {
        unit: 'Palisades',
        power: 0,
        downDate: '2025-09-09',
        reasonComment: 'Plant Restart',
        scrams: null,
      },
      {
        unit: 'McGuire 1',
        power: 94,
        downDate: null,
        reasonComment: 'Coastdown to Refueling Outage',
        scrams: 1,
      },
    ]);
    assert.equal(dailyPageHasReasonColumn(html), true);
  });

  it('drops null bytes that Postgres cannot store', () => {
    const html = `
      <table>
        <tr><th>Unit</th><th>Power</th><th>Down</th><th>Reason or Comment</th></tr>
        <tr><td>Hatch 1</td><td>100</td><td></td><td>Refueling\u0000 outage</td></tr>
      </table>
    `;
    assert.equal(parseDailyReportPage(html)[0]?.reasonComment, 'Refueling outage');
  });

  it('reads a power-only table from the last 28 days', () => {
    const html = `
      <table>
        <tr><th>Unit</th><th>Power</th></tr>
        <tr><td>Comanche Peak 1</td><td>91</td></tr>
      </table>
    `;
    assert.deepEqual(parseDailyReportPage(html), [
      {
        unit: 'Comanche Peak 1',
        power: 91,
        downDate: null,
        reasonComment: null,
        scrams: null,
      },
    ]);
    assert.equal(dailyPageHasReasonColumn(html), false);
  });
});
