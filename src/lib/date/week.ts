// ISO-8601 week helpers. Used to bucket the weekly curated picks so the
// admin console, the LinkedIn draft, and the public /this-week page all
// agree on "which week" without a stored week concept anywhere else.

/** Current ISO week id, e.g. "2026-W28". */
export function getCurrentWeekId(date: Date = new Date()): string {
  // Copy as UTC midnight so DST/local offsets can't shift the day.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // ISO: the Thursday of the current week decides the year and week number.
  const dayNum = d.getUTCDay() || 7; // Sun=0 -> 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/** Human label for a week id, e.g. "week of 6 Jul 2026" (the ISO Monday). */
export function weekLabel(weekId: string): string {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);
  if (!year || !week) return weekId;

  // ISO week 1 contains 4 January; find that week's Monday, then step forward.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);

  return `week of ${monday.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })}`;
}
