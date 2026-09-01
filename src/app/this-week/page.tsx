import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { getPublishedWeek } from '@/lib/weekly/store';
import { toJobListItem } from '@/lib/data/static';
import { jobOneLiner } from '@/lib/jobs/oneLiner';
import { JobCard } from '@/components/JobCard';
import { JobAlertForm } from '@/components/JobAlertForm';
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbCurrent,
  BrowseLabel,
  BrowseTitle,
  BrowseMeta,
  BrowseAlertLink,
} from '@/components/BrowsePageHeader';
import { generateBreadcrumbSchema } from '@/lib/seo/schema';

export async function generateMetadata(): Promise<Metadata> {
  const week = await getPublishedWeek();
  const count = week?.jobs.length ?? 0;

  const title = 'This Week in Nuclear — Notable Roles | Nuclear Hustle';
  const description =
    count > 0
      ? `${count} notable US nuclear roles at operators, contractors, and engineering firms — reviewed and updated weekly.`
      : 'A weekly pick of notable US nuclear roles — reviewed and updated every week.';

  return {
    title,
    description,
    alternates: { canonical: '/this-week' },
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://www.nuclearhustle.com/this-week',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ThisWeekPage() {
  const week = await getPublishedWeek();
  const jobs = week?.jobs ?? [];
  // Keep the full job alongside the list item so we can surface a short,
  // auto-sourced role summary under each pick.
  const picks = jobs.map((job) => ({
    item: toJobListItem(job),
    description: jobOneLiner(job, { maxSentences: 1, maxLength: 200 }) ?? undefined,
  }));
  const count = picks.length;
  const refreshedLabel = week
    ? new Date(week.publishedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  const breadcrumbData = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.nuclearhustle.com/' },
    { name: 'This Week', url: 'https://www.nuclearhustle.com/this-week' },
  ]);

  return (
    <div className="min-h-screen bg-canvas">
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbCurrent>This Week</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>

        <BrowseLabel>Editor&rsquo;s pick</BrowseLabel>
        <BrowseTitle>This week in nuclear</BrowseTitle>

        <div className="flex flex-wrap items-center gap-4">
          <BrowseMeta>
            {count > 0 ? (
              <>
                <strong>{count}</strong> notable role{count !== 1 ? 's' : ''} at US operators,
                contractors, and engineering firms
              </>
            ) : (
              <>This week&rsquo;s picks go up soon</>
            )}
          </BrowseMeta>
          {count > 0 && (
            <BrowseAlertLink href="/signup">★ Get weekly job alerts →</BrowseAlertLink>
          )}
        </div>

        {refreshedLabel && (
          <p className="mt-4 font-mono text-xs tracking-widest uppercase text-secondary">
            Refreshed {refreshedLabel}
          </p>
        )}
      </BrowsePageHeader>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {count > 0 ? (
          <>
            <p className="mb-6 max-w-2xl font-sans text-base leading-relaxed text-secondary">
              A short list of roles worth a look this week, chosen from everything posted across the
              US nuclear fleet. New jobs go up daily — browse the full board any time.
            </p>

            <div className="border border-rule">
              {picks.map(({ item, description }) => (
                <JobCard key={item.id} job={item} description={description} />
              ))}
            </div>

            <div className="mt-6">
              <Link
                href="/jobs"
                className="font-mono text-xs tracking-widest uppercase text-secondary hover:text-ink transition-colors underline underline-offset-2"
              >
                Browse all jobs →
              </Link>
            </div>
          </>
        ) : (
          <div className="border border-rule p-10 text-center">
            <p className="mb-2 font-sans text-base text-secondary">
              This week&rsquo;s picks haven&rsquo;t been published yet.
            </p>
            <p className="mb-6 font-sans text-sm text-secondary">
              New roles are added daily — get notified the moment one is posted.
            </p>
            <div className="flex justify-center mb-4">
              <JobAlertForm />
            </div>
            <Link
              href="/jobs"
              className="font-mono text-xs tracking-widest uppercase text-secondary hover:text-ink transition-colors underline underline-offset-2"
            >
              Or browse all jobs →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
