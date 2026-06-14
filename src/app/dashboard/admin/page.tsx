import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getJobs, getAllJobsForAdmin, getCompanies } from '@/lib/data/static';
import { readAgentRuns } from '@/lib/ops/runLog';
import { JobChart } from '@/components/admin/JobChart';
import { PipelinePanel, type PipelineStats } from '@/components/admin/PipelinePanel';
import { AgentRunsPanel } from '@/components/admin/AgentRunsPanel';

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

async function getEmployerJobsForAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('employer_jobs')
    .select('id, created_at, is_active')
    .order('created_at', { ascending: true });
  return data || [];
}

async function getMemberStats() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, role, created_at')
    .order('created_at', { ascending: true });
  return profiles || [];
}

function buildChartData(
  scrapedJobs: { scraped_at: string }[],
  employerJobs: { created_at: string }[]
) {
  const buckets = new Map<string, { scraped: number; employer: number }>();

  for (const job of scrapedJobs) {
    const key = new Date(job.scraped_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const entry = buckets.get(key) || { scraped: 0, employer: 0 };
    entry.scraped++;
    buckets.set(key, entry);
  }

  for (const job of employerJobs) {
    const key = new Date(job.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const entry = buckets.get(key) || { scraped: 0, employer: 0 };
    entry.employer++;
    buckets.set(key, entry);
  }

  return Array.from(buckets.entries())
    .sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    )
    .map(([date, counts]) => ({ date, ...counts }));
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
  const [employerJobs, members] = await Promise.all([
    getEmployerJobsForAdmin(),
    getMemberStats(),
  ]);

  const totalScraped = scrapedJobs.length;
  const totalEmployer = employerJobs.length;
  const activeEmployer = employerJobs.filter((j) => j.is_active).length;
  const inactiveEmployer = totalEmployer - activeEmployer;

  const totalMembers = members.length;
  const employers = members.filter((m) => m.role === 'employer');
  const jobSeekers = members.filter((m) => m.role === 'job_seeker');

  const chartData = buildChartData(scrapedJobs, employerJobs);

  const jobStats = [
    { label: 'Total Jobs', value: totalScraped + totalEmployer },
    { label: 'Scraped', value: totalScraped },
    { label: 'Employer', value: totalEmployer },
    { label: 'Active', value: totalScraped + activeEmployer },
    { label: 'Inactive', value: inactiveEmployer },
  ];

  const memberStats = [
    { label: 'Total Members', value: totalMembers },
    { label: 'Employers', value: employers.length },
    { label: 'Job Seekers', value: jobSeekers.length },
  ];

  const recentMembers = [...members]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const pipeline = buildPipelineStats();
  const agentRuns = readAgentRuns(12);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Operations</h1>
      <p className="text-sm text-gray-500 mb-8 font-mono">
        Run and monitor the site&apos;s automated processes
      </p>

      {/* Processes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <PipelinePanel stats={pipeline} />
        <AgentRunsPanel runs={agentRuns} />
      </div>

      <h2 className="text-sm font-mono tracking-widest uppercase text-gray-500 mb-3">Jobs</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {jobStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-mono tracking-widest uppercase text-gray-500 mb-3">
        Members
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {memberStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-mono tracking-widest uppercase text-gray-500 mb-4">
            Job Postings Over Time
          </h2>
          <JobChart data={chartData} />
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-sm font-mono tracking-widest uppercase text-gray-500 mb-4">
            Recent Members
          </h2>
          {recentMembers.length === 0 ? (
            <p className="text-sm text-gray-400 font-mono py-8 text-center">
              No members yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-mono text-gray-500">
                        {member.role === 'employer' ? 'E' : 'JS'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">
                        {member.id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                      member.role === 'employer'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {member.role === 'employer' ? 'employer' : 'job seeker'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
