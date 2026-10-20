export function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatWindow(start: string, end: string): string {
  return `${formatLongDate(start)} to ${formatLongDate(end)}`;
}

/** "Jan 22 to Mar 5, 2027" when both ends share a year, else the long form. */
export function formatCompactWindow(start: string, end: string): string {
  if (start.slice(0, 4) !== end.slice(0, 4)) return formatWindow(start, end);
  return `${formatLongDate(start).replace(/, \d{4}$/, '')} to ${formatLongDate(end)}`;
}

export function cycleMonths(cycleDays: number): number {
  return Math.round(cycleDays / 30.4375);
}

export function seasonOf(iso: string): 'spring' | 'fall' | null {
  const month = Number(iso.slice(5, 7));
  if (month >= 2 && month <= 5) return 'spring';
  if (month >= 9 && month <= 11) return 'fall';
  return null;
}

export function confidenceLabel(confidence: string): string {
  switch (confidence) {
    case 'coastdown':
      return 'Coasting down';
    case 'isi_letter':
      return 'ISI letter';
    case 'started':
      return 'Started';
    default:
      return 'Forecast';
  }
}

export function outageTypeLabel(type: string): string {
  switch (type) {
    case 'refueling':
      return 'Refueling';
    case 'unplanned':
      return 'Unplanned';
    case 'maintenance':
      return 'Maintenance';
    default:
      return 'Offline';
  }
}
