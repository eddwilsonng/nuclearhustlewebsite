import type { Salary } from './types';

function fmt(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

/** "$71k–$172k / yr" or "$64/hr". Returns null when salary is absent. */
export function formatSalary(salary?: Salary | null): string | null {
  if (!salary) return null;
  const { min, max, period } = salary;
  const suffix = period === 'hour' ? '/hr' : '/yr';

  if (min === null && max === null) return null;

  if (min === max || max === null || min === null) {
    const val = min ?? max!;
    return period === 'hour' ? `$${val}${suffix}` : `${fmt(val)}${suffix}`;
  }

  if (period === 'hour') return `$${min}–$${max}${suffix}`;
  return `${fmt(min)}–${fmt(max)}${suffix}`;
}
