import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import { getAllJobsForAdmin } from '@/lib/data/jobs-full';
import { getJobs, getCompanies } from '@/lib/data/static';
import { readAgentRuns } from '@/lib/ops/runLog';
import { JobChart } from '@/components/admin/JobChart';
import { PipelinePanel, type PipelineStats } from '@/components/admin/PipelinePanel';
import { AgentRunsPanel } from '@/components/admin/AgentRunsPanel';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/LinkButton';
import { StatRow } from '@/components/ui/StatRow';
import {
  DashboardAlert,
  DashboardBody,
  DashboardPageHeader,
  DashboardSection,
} from '@/components/dashboard/DashboardChrome';
import type { UserRole } from '@/lib/types';

export const metadata = {
  title: 'Operations - Nuclear Hustle',
};

function buildPipelineStats(): PipelineStats {
  const all = getAllJobsForAdmin();
  const companies = getCompanies();
  const nameById = new Map(companies.map((c) => [c.id, c.name]));

  const pending = all.filter((j) => j.status === 'pending_review');
  const published = all.filter((j) => !j.status || j.status === 'published');
  const rejected = all.filter((j) => j.status === 'rejected');

  const sourceMap = new Map<string, { pending: number; published: number }>();
  for (const j of all) {
    const entry = sourceMap.get(j.company_id) || { pending: 0, published: 0 };
    if (j.status === 'pending_review') entry.pending++;
    else if (!j.status || j.status === 'published') entry.published++;
    sourceMap.set(j.company_id, entry);
  }

  const bySource = Array.from(sourceMap.entries())
    .map(([id, v]) => ({ id, name: nameById.get(id) || id, ...v }))
    .filter((s) => s.pending + s.published > 0)
    .sort((a, b) => b.pending + b.published - (a.pending + a.published))
    .slice(0, 8);

  return {
    total: all.length,
    pending: pending.length,
    published: published.length,
    rejected: rejected.length,
    high: pending.filter((j) => j.agent_confidence !== 'low').length,
    low: pending.filter((j) => j.agent_confidence === 'low').length,
    bySource,
  };
}

// Admin-only reads use the service client: RLS would limit the signed-in admin
// to their own rows. Callers check isAdmin() first.
async function getEmployerJobsForAdmin() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('employer_jobs')
    .select('id, created_at, is_active')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

type MemberRow = {
  id: string;
  role: UserRole | null;
  created_at: string;
  full_name: string | null;
  email: string | null;
};

async function getMemberStats(): Promise<MemberRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, created_at, full_name, email')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const ROLE_LABEL: Record<UserRole, string> = {
  employer: 'Employer',
  job_seeker: 'Job seeker',
};

function buildChartData(
  scrapedJobs: { scraped_at: string }[],
  employerJobs: { created_at: string }[]
) {
  // Bucket by calendar day (YYYY-MM-DD) so the same date in different years
  // never merges, and the keys sort chronologically as strings.
  const buckets = new Map<string, { scraped: number; employer: number }>();
  const add = (iso: string, field: 'scraped' | 'employer') => {
    const day = new Date(iso);
    if (Number.isNaN(day.getTime())) return;
    const key = day.toISOString().slice(0, 10);
    const entry = buckets.get(key) || { scraped: 0, employer: 0 };
    entry[field]++;
    buckets.set(key, entry);
  };

  for (const job of scrapedJobs) add(job.scraped_at, 'scraped');
  for (const job of employerJobs) add(job.created_at, 'employer');

  const sorted = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
  const spansYears =
    sorted.length > 0 && sorted[0][0].slice(0, 4) !== sorted[sorted.length - 1][0].slice(0, 4);

  return sorted.map(([key, counts]) => ({
    date: new Date(`${key}T00:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: spansYears ? 'numeric' : undefined,
      timeZone: 'UTC',
    }),
    ...counts,
  }));
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard');
  }

  const scrapedJobs = getJobs();
  let employerJobs: Awaited<ReturnType<typeof getEmployerJobsForAdmin>> = [];
  let members: MemberRow[] = [];
  let accountsFailed = false;
  try {
    [employerJobs, members] = await Promise.all([getEmployerJobsForAdmin(), getMemberStats()]);
  } catch {
    accountsFailed = true;
  }

  const totalScraped = scrapedJobs.length;
  const totalEmployer = employerJobs.length;
  const activeEmployer = employerJobs.filter((j) => j.is_active).length;
  const inactiveEmployer = totalEmployer - activeEmployer;

  const employers = members.filter((m) => m.role === 'employer');
  const jobSeekers = members.filter((m) => m.role === 'job_seeker');

  const chartData = buildChartData(scrapedJobs, employerJobs);
  const count = (n: number) => n.toLocaleString('en-US');

  const jobStats = [
    { label: 'Total jobs', value: count(totalScraped + totalEmployer), href: '/dashboard/admin/jobs' },
    { label: 'Scraped', value: count(totalScraped) },
    { label: 'Employer', value: count(totalEmployer) },
    { label: 'Active', value: count(totalScraped + activeEmployer) },
    { label: 'Inactive', value: count(inactiveEmployer), detail: 'Employer listings' },
  ];

  const memberStats = [
    { label: 'Total members', value: count(members.length) },
    { label: 'Employers', value: count(employers.length) },
    { label: 'Job seekers', value: count(jobSeekers.length) },
  ];

  const recentMembers = [...members]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const pipeline = buildPipelineStats();
  const agentRuns = readAgentRuns(12);

  return (
    <>
      <DashboardPageHeader
        title="Operations"
        description="Run and monitor the crawls, the review queue and member sign-ups."
        action={
          pipeline.pending > 0 ? (
            <LinkButton href="/dashboard/admin/review" variant="primary" size="compact">
              Review {count(pipeline.pending)} pending
            </LinkButton>
          ) : null
        }
      />

      <DashboardBody>
        {accountsFailed ? (
          <div className="mb-8">
            <DashboardAlert tone="error">
              Employer listings and members couldn&apos;t load. Check SUPABASE_SERVICE_ROLE_KEY, then refresh.
            </DashboardAlert>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-2">
          <PipelinePanel stats={pipeline} />
          <AgentRunsPanel runs={agentRuns} />
        </div>

        <DashboardSection title="Jobs">
          <StatRow stats={jobStats} />
        </DashboardSection>

        <DashboardSection title="Members">
          <StatRow stats={memberStats} />
        </DashboardSection>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <DashboardSection title="Job postings over time" className="mt-0">
            <JobChart data={chartData} />
          </DashboardSection>

          <DashboardSection title="Recent members" className="mt-0">
            {recentMembers.length === 0 ? (
              <p className="border border-dashed border-rule px-5 py-12 text-center font-sans text-sm text-secondary">
                No members yet.
              </p>
            ) : (
              <ul className="divide-y divide-rule border-y border-rule">
                {recentMembers.map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-sans text-sm font-semibold text-ink">
                        {member.full_name || member.email || 'Unnamed account'}
                      </p>
                      <p className="truncate font-mono text-xs text-secondary">
                        {member.full_name && member.email ? `${member.email} · ` : ''}
                        Joined {formatDate(member.created_at)}
                      </p>
                    </div>
                    <Badge className="shrink-0">{member.role ? ROLE_LABEL[member.role] : 'No role'}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>
        </div>
      </DashboardBody>
    </>
  );
}
