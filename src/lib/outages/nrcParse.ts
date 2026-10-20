export interface PowerStatusRow {
  reportDate: string;
  unit: string;
  power: number;
}

export interface DailyReportRow {
  unit: string;
  power: number | null;
  downDate: string | null;
  reasonComment: string | null;
  scrams: number | null;
}

export function normalizeNrcName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/** `M/D/YYYY` or `M/D/YYYY h:mm:ss AM`, including single-digit month and day. */
export function parseNrcReportDate(raw: string): string | null {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parsePowerStatusFile(text: string): PowerStatusRow[] {
  if (/<html/i.test(text.slice(0, 200))) {
    throw new Error('NRC response was HTML, not the power status file');
  }

  const rows: PowerStatusRow[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const parts = line.split('|');
    if (parts.length < 3) continue;
    const reportDate = parseNrcReportDate(parts[0] ?? '');
    const unit = normalizeNrcName(parts[1] ?? '');
    const power = Number.parseInt((parts[2] ?? '').trim(), 10);
    if (!reportDate || !unit || Number.isNaN(power)) continue;
    rows.push({ reportDate, unit, power });
  }
  return rows;
}

function decodeCell(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

/**
 * Region tables on an NRC daily report page.
 * Recent pages are Unit | Power. After 28 days the page gains Down, Reason, and Scrams.
 */
export function dailyPageHasReasonColumn(html: string): boolean {
  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let match: RegExpExecArray | null;
  while ((match = trRe.exec(html))) {
    const cells = [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      decodeCell(cell[1]),
    );
    if (/^unit$/i.test(cells[0] ?? '') && cells.some((cell) => /^power$/i.test(cell))) {
      return cells.some((cell) => /reason|comment/i.test(cell));
    }
  }
  return false;
}

export function parseDailyReportPage(html: string): DailyReportRow[] {
  const rows: DailyReportRow[] = [];
  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let headers: string[] | null = null;
  let match: RegExpExecArray | null;

  while ((match = trRe.exec(html))) {
    const cells = [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      decodeCell(cell[1]),
    );
    if (cells.length === 0) continue;
    if (/^unit$/i.test(cells[0]) && cells.some((cell) => /^power$/i.test(cell))) {
      headers = cells;
      continue;
    }
    if (!headers || !cells[0]) continue;

    const indexOf = (label: string) =>
      headers!.findIndex((header) => header.toLowerCase().startsWith(label.toLowerCase()));
    const powerIndex = indexOf('power');
    const downIndex = indexOf('down');
    const reasonIndex = headers.findIndex((header) => /reason|comment/i.test(header));
    const scramIndex = headers.findIndex((header) => /scram/i.test(header));

    const powerText = powerIndex >= 0 ? cells[powerIndex] : '';
    const power = powerText === '' ? null : Number.parseInt(powerText, 10);
    const scramText = scramIndex >= 0 ? cells[scramIndex] : '';
    const scrams = scramText === '' || scramText === undefined ? null : Number.parseInt(scramText, 10);

    rows.push({
      unit: normalizeNrcName(cells[0]),
      power: power === null || Number.isNaN(power) ? null : power,
      downDate: downIndex >= 0 ? blankToNull(cells[downIndex]) : null,
      reasonComment: reasonIndex >= 0 ? blankToNull(cells[reasonIndex]) : null,
      scrams: scrams === null || Number.isNaN(scrams) ? null : scrams,
    });
  }

  return rows;
}
