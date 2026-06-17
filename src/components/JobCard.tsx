import Link from 'next/link';
import { JobListItem } from '@/lib/types';
import { SaveJobButton } from './job/SaveJobButton';
import { getSkillIconCategory } from '@/lib/seo/skillIcons';
import { Award, Zap, Monitor, Shield, Tag } from 'lucide-react';

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

  const hasSkills = job.skills && job.skills.length > 0;

  return (
    <Link
      href={`/job/${job.slug}`}
      className={`block px-4 py-4 bg-[#EDE8DF] border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors group ${isFeatured ? 'border-l-2 border-l-yellow-400' : ''}`}
    >
      {/* Top row: initials + title + meta */}
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        {/* Company initials */}
        <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border ${isEmployerJob ? 'border-yellow-300 bg-yellow-50' : 'border-[#CFC8BC] bg-[#E5DFD5]'}`}>
          <span className={`font-mono text-xs font-bold ${isEmployerJob ? 'text-yellow-600' : 'text-stone-400'}`}>
            {getCompanyInitials(job.company.name)}
          </span>
        </div>

        {/* Job info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-mono text-sm font-semibold text-stone-900 line-clamp-2 sm:truncate sm:line-clamp-none group-hover:text-yellow-600 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center justify-between gap-3 mt-0.5">
            <p className="font-mono text-xs text-stone-400 min-w-0 truncate">
              {job.company.name} <span aria-hidden="true">//</span> {job.location}
            </p>
            <span className="font-mono text-[10px] text-stone-400 whitespace-nowrap shrink-0 sm:hidden" suppressHydrationWarning>
              {getPostedLabel(job.scraped_at)}
            </span>
          </div>
        </div>

        {/* Right meta — desktop only */}
        <div className="hidden sm:flex flex-shrink-0 items-center gap-3">
          {isFeatured && (
            <span className="font-mono text-[10px] tracking-widest uppercase border border-yellow-400 bg-yellow-50 text-yellow-700 px-2 py-0.5">
              Featured
            </span>
          )}
          {isEmployerJob && !isFeatured && (
            <span className="font-mono text-[10px] tracking-widest uppercase border border-yellow-200 text-yellow-600 px-2 py-0.5">
              Direct
            </span>
          )}
          {job.employment_type && (
            <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 border border-[#CFC8BC] px-2 py-0.5">
              {job.employment_type}
            </span>
          )}
          {showCategory && (
            <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 border border-[#CFC8BC] px-2 py-0.5">
              {categoryLabel}
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

      {/* Skills row */}
      {hasSkills && (
        <div className="mt-2.5 ml-[52px] flex flex-wrap gap-1.5">
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
          <h3 className="font-mono text-xs font-semibold text-stone-900 truncate group-hover:text-yellow-600 transition-colors">
            {job.title}
          </h3>
          <p className="font-mono text-xs text-stone-400 mt-0.5">{job.company.name} // {job.location}</p>
        </div>
        <span className="font-mono text-[10px] text-stone-400 flex-shrink-0 whitespace-nowrap" suppressHydrationWarning>
          {getPostedLabel(job.scraped_at)}
        </span>
      </div>
    </Link>
  );
}
