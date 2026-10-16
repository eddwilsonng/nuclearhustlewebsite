import type { JobWithCompany } from '@/lib/types';
import {
  digestPlantName,
  digestStateCodes,
  dominantCompany,
  pickDigestHero,
} from './digestModel';

const STEM = "This week's nuclear roles";

function formatStateTail(codes: string[]): string {
  if (codes.length === 0) return '';
  if (codes.length === 1) return codes[0];
  if (codes.length === 2) return `${codes[0]} & ${codes[1]}`;
  return codes.join(', ');
}

function subjectTail(jobs: JobWithCompany[]): string {
  const codes = digestStateCodes(jobs, 3);
  const places = formatStateTail(codes);
  const company = dominantCompany(jobs);

  if (company?.short && codes.length > 0 && codes.length <= 2) {
    return `${company.short}, ${places}`;
  }

  return places;
}

/**
 * Inbox line stays recognizable every week. The tail is the fact that
 * changes: the employer when one company is the batch, otherwise the states.
 */
export function weeklyDigestSubject(jobs: JobWithCompany[]): string {
  if (jobs.length === 0) return STEM;
  const tail = subjectTail(jobs);
  return tail ? `${STEM} — ${tail}` : STEM;
}

function titleForPreheader(job: JobWithCompany): string {
  const plant = digestPlantName(job);
  let title = job.title.trim();

  if (plant) {
    const escaped = plant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stripped = title
      .replace(new RegExp(`\\s*[-–—|]\\s*${escaped}.*$`, 'i'), '')
      .replace(new RegExp(`\\s*\\([^)]*${escaped}[^)]*\\)\\s*$`, 'i'), '')
      .trim();
    if (stripped) title = stripped;
  }

  if (title.length <= 90) return title;
  const cut = title.slice(0, 90);
  const lastSpace = cut.lastIndexOf(' ');
  const base = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim();
  return `${base}…`;
}

export function weeklyDigestPreheader(jobs: JobWithCompany[]): string {
  const hero = pickDigestHero(jobs);
  if (!hero) return 'Reactor operators, engineers, and plant roles, updated weekly.';

  const place = digestPlantName(hero) ?? hero.company.name;
  const title = titleForPreheader(hero);
  if (jobs.length === 1) return `${title} at ${place}.`;
  return `${title} at ${place}, plus ${jobs.length - 1} more.`;
}
