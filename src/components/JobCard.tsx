import Link from 'next/link';
import { JobWithCompany } from '@/lib/types';

interface JobCardProps {
  job: JobWithCompany;
}

function getTimeSince(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return '1w ago';
  return `${Math.floor(diffDays / 7)}w ago`;
}

function getCompanyInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const CATEGORY_LABELS: Record<string, string> = {
  'operations': 'Operations',
  'engineering': 'Engineering',
  'maintenance': 'Maintenance',
  'health-physics': 'Health Physics',
  'security': 'Security',
  'administrative': 'Administrative',
  'other': 'Other',
};

export function JobCard({ job }: JobCardProps) {
  const categoryLabel = CATEGORY_LABELS[job.category] || job.category;
  const isEmployerJob = job.isEmployerJob;

  return (
    <Link
      href={`/job/${job.slug}`}
      className="flex items-center gap-4 px-4 py-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors group"
    >
      {/* Company initials */}
      <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border ${isEmployerJob ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}>
        <span className={`font-mono text-xs font-bold ${isEmployerJob ? 'text-yellow-600' : 'text-gray-400'}`}>
          {getCompanyInitials(job.company.name)}
        </span>
      </div>

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-yellow-600 transition-colors">
          {job.title}
        </h3>
        <p className="font-mono text-xs text-gray-400 mt-0.5">
          {job.company.name} <span className="text-gray-200">//</span> {job.location}
        </p>
      </div>

      {/* Right side meta */}
      <div className="flex-shrink-0 flex items-center gap-4">
        {isEmployerJob && (
          <span className="hidden sm:block font-mono text-xs tracking-widest uppercase border border-yellow-200 text-yellow-600 px-2 py-0.5">
            Direct
          </span>
        )}
        <span className="hidden sm:block font-mono text-xs tracking-widest uppercase text-gray-300 border border-gray-100 px-2 py-0.5">
          {categoryLabel}
        </span>
        <span className="font-mono text-xs text-gray-300" suppressHydrationWarning>
          {getTimeSince(job.scraped_at)}
        </span>
      </div>
    </Link>
  );
}

// Compact version for sidebars
export function JobCardCompact({ job }: JobCardProps) {
  return (
    <Link
      href={`/job/${job.slug}`}
      className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-mono text-xs font-semibold text-gray-900 truncate group-hover:text-yellow-600 transition-colors">
            {job.title}
          </h3>
          <p className="font-mono text-xs text-gray-400 mt-0.5">{job.company.name} // {job.location}</p>
        </div>
        <span className="font-mono text-xs text-gray-300 flex-shrink-0" suppressHydrationWarning>
          {getTimeSince(job.scraped_at)}
        </span>
      </div>
    </Link>
  );
}
