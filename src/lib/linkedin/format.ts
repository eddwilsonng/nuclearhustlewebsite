import type { CuratedJob } from './curate';
import { formatSalary } from '@/lib/salary';

// Always use production URL — these posts go on LinkedIn, never localhost.
const SITE_URL = 'https://www.nuclearhustle.com';

const INTROS = [
  'New nuclear jobs this week ⚛️',
  'Fresh roles in the nuclear sector 🔬',
  'Nuclear hiring is active — here\'s what\'s open 🏭',
  'This week in nuclear jobs ⚡',
  'Hot nuclear roles posted this week 🔥',
];

const CATEGORY_EMOJI: Record<string, string> = {
  engineering: '⚙️',
  operations: '⚛️',
  maintenance: '🔧',
  'health-physics': '☢️',
  security: '🛡️',
  training: '📋',
  administrative: '📊',
  other: '💼',
};

function jobLine(cj: CuratedJob): string {
  const { job } = cj;
  const emoji = CATEGORY_EMOJI[job.category] ?? '💼';
  const salary = formatSalary(job.salary);
  const salaryPart = salary ? ` | ${salary}` : '';
  const url = `${SITE_URL}/job/${job.slug}`;

  return [
    `${emoji} ${job.title}`,
    `${job.company.name} | 🇺🇸 ${job.location}${salaryPart}`,
    url,
  ].join('\n');
}

export function formatLinkedInPost(picks: CuratedJob[]): string {
  const intro = INTROS[new Date().getDay() % INTROS.length];
  const lines = picks.map(jobLine).join('\n\n');

  return [
    intro,
    '',
    lines,
    '',
    '—',
    'Follow Nuclear Hustle for daily US nuclear job updates.',
    '#NuclearEnergy #NuclearJobs #NuclearPower #NuclearIndustry',
  ].join('\n');
}
