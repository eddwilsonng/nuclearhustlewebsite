import { unstable_cache } from 'next/cache';

export interface UnitStatus {
  nrcName: string;
  power: number | null;
}

export const getNrcStatus = unstable_cache(
  async (): Promise<{ status: Record<string, number>; reportDate: string }> => {
    let status: Record<string, number> = {};
    let reportDate = '';
    try {
      const res = await fetch(
        'https://www.nrc.gov/reading-rm/doc-collections/event-status/reactor-status/PowerReactorStatusForLast365Days.txt',
        { cache: 'no-store' }
      );
      if (!res.ok) return { status, reportDate };

      const text = await res.text();
      const lines = text.trim().split(/\r?\n/);

      let maxTime = -Infinity;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split('|');
        if (parts.length < 3) continue;
        const date = parts[0]?.trim();
        if (!date) continue;
        const time = Date.parse(date);
        if (isNaN(time)) continue;

        const unit = parts[1]?.trim();
        const power = parseInt(parts[2]?.trim() ?? '', 10);

        if (time > maxTime) {
          maxTime = time;
          reportDate = date;
          status = {};
        }
        if (date === reportDate && unit && !isNaN(power)) {
          status[unit] = power;
        }
      }
    } catch {
      // NRC fetch failed — units will show as unknown
    }
    return { status, reportDate };
  },
  ['nrc-power-status'],
  { revalidate: 3600 }
);

export function getPlantStatus(avgPower: number | null): 'full' | 'reduced' | 'offline' | 'unknown' {
  if (avgPower === null) return 'unknown';
  if (avgPower === 0) return 'offline';
  if (avgPower >= 95) return 'full';
  return 'reduced';
}
