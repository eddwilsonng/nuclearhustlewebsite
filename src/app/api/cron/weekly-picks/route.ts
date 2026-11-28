import { NextRequest, NextResponse } from 'next';
import { publishWeeklyPicks } from '@/lib/weekly/actions';
import { getAllJobsForList } from '@/lib/data/employer';
import { getCurrentWeekId } from '@/lib/date/week';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await getAllJobsForList();
    const recentJobs = jobs.filter((job) => {
      const daysAgo = Math.floor(
        (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysAgo <= 7;
    });

    if (recentJobs.length === 0) {
      return NextResponse.json({
        message: 'No recent jobs to publish',
        week: getCurrentWeekId(),
      });
    }

    const employerDirectJobs = recentJobs.filter((job) => job.is_employer_job);
    const scrapedJobs = recentJobs.filter((job) => !job.is_employer_job);

    const categoriesUsed = new Set<string>();
    const selectedJobs: typeof recentJobs = [];

    for (const job of employerDirectJobs) {
      if (selectedJobs.length >= 8) break;
      selectedJobs.push(job);
      if (job.category) categoriesUsed.add(job.category);
    }

    for (const job of scrapedJobs) {
      if (selectedJobs.length >= 8) break;
      if (!job.category || !categoriesUsed.has(job.category)) {
        selectedJobs.push(job);
        if (job.category) categoriesUsed.add(job.category);
      }
    }

    while (selectedJobs.length < 8 && selectedJobs.length < recentJobs.length) {
      const remaining = recentJobs.filter((job) => !selectedJobs.includes(job));
      if (remaining.length === 0) break;
      selectedJobs.push(remaining[0]);
    }

    const slugs = selectedJobs.map((job) => job.slug);
    await publishWeeklyPicks(slugs);

    return NextResponse.json({
      success: true,
      week: getCurrentWeekId(),
      published: slugs.length,
      slugs,
    });
  } catch (error) {
    console.error('Weekly picks cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
