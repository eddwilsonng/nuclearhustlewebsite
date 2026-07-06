import Link from 'next/link';
import { JobListItem } from '@/lib/types';
import { SaveJobButton } from './job/SaveJobButton';
import { getSkillIconCategory } from '@/lib/seo/skillIcons';
import { Award, Zap, Monitor, Shield, Tag } from 'lucide-react';
import { formatSalary } from '@/lib/salary';

const SKILL_ICONS = { award: Award, zap: Zap, monitor: Monitor, shield: Shield, tag: Tag };

interface JobCardProps {
  job: JobListItem;
  hideCategory?: boolean; // suppress redundant tag when already on a category page
  isAuthenticated?: boolean;
  initialSaved?: boolean;
}

function getPostedLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays < 7) return `${diffDays}d ago`;
  // Neutral month/year for anything a week+ old — no stale "17w ago" signals
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getCompanyInitials(name: string): string {
  return name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
}

const CATEGORY_LABELS: Record<string, string> = {
  'operations':    'Operations',
  'engineering':   'Engineering',
  'maintenance':   'Maintenance',
  'health-physics':'Health Physics',
  'security':      'Security',
  'training':      'Training & Licensing',
  'administrative':'Administrative',
  'other':         'Other',
};

export function JobCard({ job, hideCategory = false, isAuthenticated = false, initialSaved = false }: JobCardProps) {
  const categoryLabel = CATEGORY_LABELS[job.category] || job.category;
  const isEmployerJob = job.isEmployerJob;
  const isFeatured = job.is_featured && job.featured_until && new Date(job.featured_until) > new Date();
  const showCategory = !hideCategory && job.category !== 'other';
  const salaryLabel = formatSalary(job.salary);

  const hasSkills = job.skills && job.skills.length > 0;

  // One context chip, not five — category when it's meaningful, otherwise the
  // employment type. The salary stays the strongest right-side element.
  const contextLabel = showCategory ? categoryLabel : job.employment_type || null;

  return (
    <Link
      href={`/job/${job.slug}`}
      className={`block px-4 py-5 bg-[#EDE8DF] border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors group ${isFeatured ? 'border-l-2 border-l-yellow-400' : ''}`}
    >
      {/* Top row: initials + title + meta */}
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Company initials */}
        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border ${isEmployerJob ? 'border-yellow-300 bg-yellow-50' : 'border-[#CFC8BC] bg-[#E5DFD5]'}`}>
          <span className={`font-mono text-xs font-bold ${isEmployerJob ? 'text-yellow-700' : 'text-stone-400'}`}>
            {getCompanyInitials(job.company.name)}
          </span>
        </div>

        {/* Info column — holds title, meta, right-meta and skills so the skills
            row aligns under the title without a hardcoded indent. */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            {/* Job title + company/location */}
            <div className="min-w-0">
              <h3 className="font-sans text-[15px] font-semibold tracking-tight text-stone-900 line-clamp-2 sm:truncate sm:line-clamp-none group-hover:text-yellow-500 transition-colors">
                {job.title}
              </h3>
              <div className="flex items-center justify-between gap-3 mt-1">
                <p className="font-mono text-xs text-stone-500 min-w-0 truncate">
                  {job.company.name} <span aria-hidden="true">//</span> {job.location}
                </p>
                <span className="font-mono text-[10px] text-stone-400 whitespace-nowrap shrink-0 sm:hidden" suppressHydrationWarning>
                  {getPostedLabel(job.scraped_at)}
                </span>
              </div>
            </div>

            {/* Right meta — desktop only */}
            <div className="hidden sm:flex flex-shrink-0 items-center gap-2.5">
              {isFeatured && (
                <span className="font-mono text-[10px] tracking-widest uppercase border border-yellow-400 bg-yellow-50 text-yellow-700 px-2 py-0.5">
                  Featured
                </span>
              )}
              {isEmployerJob && !isFeatured && (
                <span className="font-mono text-[10px] tracking-widest uppercase border border-yellow-400 bg-yellow-50 text-yellow-700 px-2 py-0.5">
                  Direct
                </span>
              )}
              {contextLabel && (
                <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 border border-[#CFC8BC] px-2 py-0.5">
                  {contextLabel}
                </span>
              )}
              {salaryLabel && (
                <span className="font-mono text-[10px] font-semibold text-stone-900 border border-[#CFC8BC] bg-[#E5DFD5] px-2 py-0.5 whitespace-nowrap">
                  {salaryLabel}
                </span>
              )}
              <span className="font-mono text-[10px] text-stone-400 whitespace-nowrap" suppressHydrationWarning>
                {getPostedLabel(job.scraped_at)}
              </span>
              <SaveJobButton
                jobSlug={job.slug}
                jobId={job.id}
                isAuthenticated={isAuthenticated}
                initialSaved={initialSaved}
                className="p-1 -mr-1"
              />
            </div>
          </div>

          {/* Skills row — aligns under the title inside the info column */}
          {hasSkills && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {job.skills!.map((skill) => {
                const Icon = SKILL_ICONS[getSkillIconCategory(skill)];
                return (
                  <span
                    key={skill}
                    className="flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase text-stone-500 border border-[#CFC8BC] px-2 py-1"
                  >
                    <Icon size={10} className="text-stone-400 flex-shrink-0" />
                    {skill}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Compact version for sidebars
export function JobCardCompact({ job }: JobCardProps) {
  return (
    <Link
      href={`/job/${job.slug}`}
      className="block px-4 py-3 hover:bg-[#E5DFD5] transition-colors border-b border-[#CFC8BC] last:border-b-0 group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-sans text-[13px] font-semibold tracking-tight text-stone-900 truncate group-hover:text-yellow-500 transition-colors">
            {job.title}
          </h3>
          <p className="font-mono text-xs text-stone-500 mt-0.5 truncate">{job.company.name} // {job.location}</p>
        </div>
        <span className="font-mono text-[10px] text-stone-400 flex-shrink-0 whitespace-nowrap" suppressHydrationWarning>
          {getPostedLabel(job.scraped_at)}
        </span>
      </div>
    </Link>
  );
}
