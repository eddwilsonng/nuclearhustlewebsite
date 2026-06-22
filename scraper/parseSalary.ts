/**
 * Salary extraction from free-text job descriptions.
 *
 * Pay-transparency laws mean most disclosing employers write a range directly
 * into the description body (e.g. "Compensation Range:$71,100.00 - $172,200.00"
 * or "Hourly Rate Range: $64.01"). This pure function pulls that out into a
 * normalized shape. It is deliberately conservative — it only emits a result
 * when there is salary *context* nearby, so cost figures like "$1 billion in
 * revenue" or "401(k)" don't get misread as pay.
 */

export interface ParsedSalary {
  min: number | null;
  max: number | null;
  period: 'year' | 'hour';
  source: 'parsed';
}

// Words that signal a nearby dollar figure is actually compensation.
const CONTEXT = /(salar|compensation|pay\s*(range|rate|scale)?|base\s*pay|target\s*pay|wage|hourly|rate\s*range|annualized|per\s*(year|hour|annum)|\/\s*(yr|hr|hour|year))/i;

// A single dollar amount: $71,100.00 | $98k | $98.5K | $64.01
const AMOUNT = String.raw`\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?\s?[kK]?|\d+(?:\.\d+)?)`;

// Plausibility bounds — reject anything outside a believable US salary window.
const ANNUAL_MIN = 15_000;
const ANNUAL_MAX = 2_000_000;
const HOURLY_MIN = 7; // ~federal minimum
const HOURLY_MAX = 400;

function toNumber(raw: string): number | null {
  let s = raw.replace(/[$,\s]/g, '');
  let mult = 1;
  if (/[kK]$/.test(s)) {
    mult = 1000;
    s = s.replace(/[kK]$/, '');
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return n * mult;
}

const fitsHourly = (values: number[]) => values.every((v) => v >= HOURLY_MIN && v <= HOURLY_MAX);
const fitsAnnual = (values: number[]) => values.every((v) => v >= ANNUAL_MIN && v <= ANNUAL_MAX);

function classify(values: number[], context: string): 'year' | 'hour' | null {
  const hourlySignal = /hour|hourly|\/\s?hr|per\s*hour/i.test(context);
  const annualSignal = /year|annual|annum|\/\s?yr|salary/i.test(context);

  // Honor an explicit textual signal, but only if the magnitude agrees — labels
  // lie ("Salary Range: $30.05 - $45.07" is hourly). Fall back to magnitude when
  // the signalled period doesn't fit the numbers.
  if (hourlySignal && !annualSignal && fitsHourly(values)) return 'hour';
  if (annualSignal && !hourlySignal && fitsAnnual(values)) return 'year';

  // No usable signal, or signal contradicted by magnitude — infer from size.
  if (fitsHourly(values)) return 'hour';
  if (fitsAnnual(values)) return 'year';
  return null;
}

export function parseSalary(text?: string | null): ParsedSalary | null {
  if (!text) return null;

  // Range first: two amounts joined by - – — "to" / "–"
  const rangeRe = new RegExp(`${AMOUNT}\\s*(?:-|–|—|to)\\s*${AMOUNT}`, 'gi');
  // Single amount fallback.
  const singleRe = new RegExp(AMOUNT, 'gi');

  // Window of context: 60 chars before the match must mention compensation.
  const hasContext = (index: number): boolean => {
    const before = text.slice(Math.max(0, index - 60), index);
    const after = text.slice(index, index + 40);
    return CONTEXT.test(before) || CONTEXT.test(after);
  };

  let match: RegExpExecArray | null;

  while ((match = rangeRe.exec(text)) !== null) {
    if (!hasContext(match.index)) continue;
    const min = toNumber(match[1]);
    const max = toNumber(match[2]);
    if (min === null || max === null) continue;
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    const period = classify([lo, hi], text.slice(Math.max(0, match.index - 60), match.index + 40));
    if (!period) continue;
    return { min: lo, max: hi, period, source: 'parsed' };
  }

  while ((match = singleRe.exec(text)) !== null) {
    if (!hasContext(match.index)) continue;
    const val = toNumber(match[1]);
    if (val === null) continue;
    const period = classify([val], text.slice(Math.max(0, match.index - 60), match.index + 40));
    if (!period) continue;
    return { min: val, max: val, period, source: 'parsed' };
  }

  return null;
}
