import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRelatedJobs } from '@/lib/data/static';
import { getAnyJobBySlug } from '@/lib/data/employer';
import { getCategoryInfo } from '@/lib/categorize';
import { getStateBySlug } from '@/lib/states';
import { parseJobDescription, formatSectionTitle } from '@/lib/parseJobDescription';
import { JobDescriptionBlock, JobDescriptionSection } from '@/components/job/JobDescriptionBlock';
import { ApplicationForm } from '@/components/job/ApplicationForm';
import { ViewTracker } from '@/components/job/ViewTracker';
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbTruncated,
  BrowseTitle,
  BrowseBadge,
  BrowseTagLink,
  BrowseChip,
  BrowseMetaLink,
} from '@/components/BrowsePageHeader';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getAnyJobBySlug(slug);

  if (!job) return { title: 'Job Not Found | Nuclear Hustle' };

  const titleCore = `${job.title} — ${job.company.name}`;
  const title = titleCore.length <= 50 ? `${titleCore} | Nuclear Hustle` : `${titleCore.slice(0, 47)}…`;
  const description = `${job.title} at ${job.company.name} in ${job.location}. Apply now on Nuclear Hustle.`;
  const url = `https://nuclearhustle.com/job/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: 'website', siteName: 'Nuclear Hustle',
      images: [{ url: `/job/${slug}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`/job/${slug}/opengraph-image`] },
  };
}

function getPostedLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  if (diffDays < 7) return `Posted ${diffDays} days ago`;
  // Beyond a week: neutral month/year so old dates don't kill intent
  return `Posted ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
}

export default async function JobPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getAnyJobBySlug(slug);
  if (!job) notFound();

  const isEmployerJob = job.isEmployerJob;
  const relatedJobs = isEmployerJob ? [] : getRelatedJobs(job, 4);
  const categoryInfo = getCategoryInfo(job.category);
  const stateInfo = job.state ? getStateBySlug(job.state) : null;

  const locationParts = job.location.split(',').map((s: string) => s.trim());
  const city = locationParts[0] || job.location;
  const region = locationParts[1] || stateInfo?.name || '';

  const postedDate = new Date(job.scraped_at);
  const validThrough = new Date(postedDate);
  validThrough.setDate(validThrough.getDate() + 30);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nuclearhustle.com';
  const employmentTypeMap: Record<string, string> = {
    'full-time': 'FULL_TIME', 'part-time': 'PART_TIME', 'contract': 'CONTRACTOR',
    'temporary': 'TEMPORARY', 'internship': 'INTERN',
  };
  const employmentType = employmentTypeMap[job.employment_type?.toLowerCase() ?? ''] || 'FULL_TIME';
  const employmentLabel = job.employment_type
    ? job.employment_type.charAt(0).toUpperCase() + job.employment_type.slice(1).toLowerCase()
    : 'Full-time';

  const descriptionFallback = [
    `${job.company.name} is hiring a ${job.title} to join their team in ${job.location}.`,
    `This is a ${categoryInfo.name.toLowerCase()} role in the nuclear power industry.`,
    categoryInfo.description,
    `Responsibilities will include work typical of a ${job.title} at a nuclear power facility, ensuring safe and efficient plant operations in compliance with NRC regulations.`,
    `To apply, visit ${job.company.name}'s careers page directly.`,
  ].join(' ');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || descriptionFallback,
    datePosted: job.scraped_at.split('T')[0],
    validThrough: validThrough.toISOString().split('T')[0],
    hiringOrganization: { '@type': 'Organization', name: job.company.name, sameAs: job.company.careers_url },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: city, addressRegion: region, addressCountry: 'US' } },
    directApply: false,
    employmentType,
    industry: 'Nuclear Energy',
    identifier: { '@type': 'PropertyValue', name: job.company.name, value: job.id },
    url: `${siteUrl}/job/${job.slug}`,
  };

  const applyUrl = job.url;
  const applyLabel = isEmployerJob && job.application_type === 'form'
    ? 'Apply for this role'
    : `Apply on ${job.company.name}`;
  const applyHref = isEmployerJob && job.application_type === 'form' ? '#apply' : applyUrl;
  const applyExternal = !(isEmployerJob && job.application_type === 'form');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      {isEmployerJob && <ViewTracker jobId={job.id.replace(/^employer-/, '')} />}

      <div className="min-h-screen bg-[#EDE8DF]">

        <BrowsePageHeader className="py-8 md:py-10">
          <BrowseBreadcrumb>
            <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
            <span className="text-stone-600">//</span>
            <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
            {stateInfo && (
              <>
                <span className="text-stone-600">//</span>
                <BrowseBreadcrumbLink href={`/jobs/${stateInfo.slug}`}>
                  {stateInfo.name}
                </BrowseBreadcrumbLink>
              </>
            )}
            <span className="text-stone-600">//</span>
            <BrowseBreadcrumbTruncated>{job.title}</BrowseBreadcrumbTruncated>
          </BrowseBreadcrumb>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {isEmployerJob && <BrowseBadge>Direct employer</BrowseBadge>}
            {categoryInfo.name !== 'Other' && (
              <BrowseTagLink href={`/jobs/role/${job.category}`}>
                {categoryInfo.name}
              </BrowseTagLink>
            )}
            {stateInfo && (
              <BrowseTagLink href={`/jobs/${stateInfo.slug}`}>
                {stateInfo.name}
              </BrowseTagLink>
            )}
          </div>

          <BrowseTitle>{job.title}</BrowseTitle>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-stone-400">
            {isEmployerJob ? (
              <span className="font-semibold text-stone-200">{job.company.name}</span>
            ) : (
              <BrowseMetaLink href={`/companies/${job.company.id}`}>
                {job.company.name}
              </BrowseMetaLink>
            )}
            <span className="text-stone-600">·</span>
            <span>{job.location}</span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-500" suppressHydrationWarning>
              {getPostedLabel(job.scraped_at)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <BrowseChip>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Nuclear industry
            </BrowseChip>
            {job.employment_type && (
              <BrowseChip>{employmentLabel}</BrowseChip>
            )}
            <BrowseChip>US only</BrowseChip>
          </div>
        </BrowsePageHeader>

        {/* Body */}
        <main className="max-w-6xl mx-auto px-6 py-10 pb-24 md:pb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* Left: description */}
            <div className="md:col-span-2 min-w-0">
              {job.structured_description ? (
                <div className="space-y-10">
                  {[
                    { key: 'about', label: 'About this role', value: job.structured_description.about },
                    { key: 'responsibilities', label: 'Responsibilities', value: job.structured_description.responsibilities },
                    { key: 'qualifications', label: 'Qualifications', value: job.structured_description.qualifications },
                    { key: 'desired', label: 'Desired', value: job.structured_description.desired },
                    { key: 'location_details', label: 'Location', value: job.structured_description.location_details },
                    { key: 'what_we_offer', label: 'What we offer', value: job.structured_description.what_we_offer },
                  ]
                    .filter(({ value }) => value && value.trim())
                    .map(({ key, label, value }) => (
                      <JobDescriptionSection key={key} label={label}>
                        <JobDescriptionBlock text={value!} />
                      </JobDescriptionSection>
                    ))}
                </div>
              ) : job.description ? (
                <StructuredJobDescription
                  description={job.description}
                  companyName={job.company.name}
                  jobTitle={job.title}
                  location={job.location}
                  categoryName={categoryInfo.name}
                />
              ) : (
                <div className="space-y-4 text-stone-600 leading-relaxed text-sm">
                  <p>{job.company.name} is hiring a <strong>{job.title}</strong> to join their team in {job.location}. This is a {categoryInfo.name.toLowerCase()} role in the nuclear power industry.</p>
                  <p>{categoryInfo.description}</p>
                  <p>Click the apply button to view the full job description and submit your application on {job.company.name}&apos;s careers website.</p>
                </div>
              )}

              {/* Bottom apply nudge — desktop only; mobile uses sticky bar */}
              <div className="hidden md:block mt-12 pt-8 border-t border-[#CFC8BC]">
                <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-3">Ready to apply?</p>
                <a
                  href={applyHref}
                  target={applyExternal ? '_blank' : undefined}
                  rel={applyExternal ? 'noopener noreferrer' : undefined}
                  className="inline-block font-mono text-xs tracking-widest uppercase py-3 px-8 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
                >
                  {applyLabel} →
                </a>
                {applyExternal && (
                  <p className="mt-2 font-mono text-[10px] text-stone-400">
                    You&apos;ll be taken to {job.company.name}&apos;s careers page.
                  </p>
                )}
              </div>
            </div>

            {/* Right: sidebar */}
            <div className="md:col-span-1">
              <div className="sticky top-6 space-y-4">

                {/* Apply card — desktop sidebar only; mobile uses sticky bar */}
                <div className="hidden md:block border border-[#CFC8BC] p-5">
                  <a
                    href={applyHref}
                    target={applyExternal ? '_blank' : undefined}
                    rel={applyExternal ? 'noopener noreferrer' : undefined}
                    className="block w-full text-center font-mono text-xs tracking-widest uppercase py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
                  >
                    {applyLabel} →
                  </a>
                  {applyExternal && (
                    <p className="mt-2.5 font-mono text-[10px] text-stone-400 leading-relaxed text-center">
                      Opens {job.company.name}&apos;s careers page
                    </p>
                  )}
                </div>

                {/* Job details */}
                <div className="border border-[#CFC8BC] p-5 space-y-4">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Job details</p>

                  <div className="space-y-3">
                    {/* Only show Type if it's a real known value, not a guess */}
                    {job.employment_type && (
                      <>
                        <div className="flex justify-between items-baseline gap-4">
                          <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Type</span>
                          <span className="font-mono text-xs text-stone-700 font-semibold">{employmentLabel}</span>
                        </div>
                        <div className="h-px bg-[#CFC8BC]" />
                      </>
                    )}
                    {/* Only show Field if it's a meaningful category */}
                    {categoryInfo.name !== 'Other' && (
                      <>
                        <div className="flex justify-between items-baseline gap-4">
                          <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Field</span>
                          <span className="font-mono text-xs text-stone-700 font-semibold">{categoryInfo.name}</span>
                        </div>
                        <div className="h-px bg-[#CFC8BC]" />
                      </>
                    )}
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Location</span>
                      <span className="font-mono text-xs text-stone-700 font-semibold text-right">{job.location}</span>
                    </div>
                    <div className="h-px bg-[#CFC8BC]" />
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Industry</span>
                      <span className="font-mono text-xs text-stone-700 font-semibold">Nuclear energy</span>
                    </div>
                    <div className="h-px bg-[#CFC8BC]" />
                    <div className="flex justify-between items-baseline gap-4" suppressHydrationWarning>
                      <span className="font-mono text-[10px] tracking-widest uppercase text-stone-400">Posted</span>
                      <span className="font-mono text-xs text-stone-700 font-semibold" suppressHydrationWarning>
                        {new Date(job.scraped_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Company card */}
                <div className="border border-[#CFC8BC] p-5">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-3">About the company</p>
                  {job.company.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.company.logo_url}
                      alt={`${job.company.name} logo`}
                      className="h-12 w-12 object-contain border border-[#CFC8BC] bg-white mb-3"
                    />
                  )}
                  {isEmployerJob ? (
                    <p className="font-mono text-sm font-bold text-stone-900 mb-2">{job.company.name}</p>
                  ) : (
                    <Link
                      href={`/companies/${job.company.id}`}
                      className="font-mono text-sm font-bold text-stone-900 hover:text-yellow-600 transition-colors mb-2 block"
                    >
                      {job.company.name} →
                    </Link>
                  )}
                  {job.company.description && (
                    <p className="text-xs text-stone-500 leading-relaxed mb-3">
                      {job.company.description}
                    </p>
                  )}
                  {job.company.careers_url && (
                    <a
                      href={job.company.careers_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
                    >
                      Careers page ↗
                    </a>
                  )}
                </div>

                {/* Set up alert nudge */}
                <div className="border border-[#CFC8BC] p-5 bg-[#E5DFD5]">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-stone-500 mb-1.5">Don&apos;t miss similar roles</p>
                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    Get notified when new {categoryInfo.name.toLowerCase()} jobs are posted.
                  </p>
                  <Link
                    href="/signup/job-seeker"
                    className="block w-full text-center font-mono text-[10px] tracking-widest uppercase py-2.5 border border-[#CFC8BC] text-stone-600 hover:bg-[#EDE8DF] hover:text-stone-900 transition-colors"
                  >
                    Create free alert →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related jobs */}
          {relatedJobs.length > 0 && (
            <div className="mt-16 pt-10 border-t border-[#CFC8BC]">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-1">More like this</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-6">Related jobs</h2>
              <div className="border border-[#CFC8BC]">
                {relatedJobs.map((relatedJob) => (
                  <Link
                    key={relatedJob.id}
                    href={`/job/${relatedJob.slug}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors group"
                  >
                    <div className="min-w-0">
                      <h3 className="font-mono text-sm font-semibold text-stone-900 group-hover:text-yellow-600 transition-colors truncate">{relatedJob.title}</h3>
                      <p className="font-mono text-xs text-stone-400 mt-0.5">{relatedJob.company.name} // {relatedJob.location}</p>
                    </div>
                    <span className="font-mono text-xs text-stone-400 shrink-0 group-hover:text-stone-700 transition-colors">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Application form */}
          {isEmployerJob && job.application_type === 'form' && (
            <div id="apply" className="mt-16 pt-10 border-t border-[#CFC8BC]">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-1">Apply now</p>
              <h2 className="font-mono text-xl font-bold text-stone-900 mb-8">Apply for {job.title}</h2>
              <div className="max-w-xl">
                <ApplicationForm jobId={job.slug} jobTitle={job.title} companyName={job.company.name} />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile sticky apply bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#EDE8DF] border-t border-[#CFC8BC] px-4 py-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-bold text-stone-900 truncate">{job.title}</p>
          <p className="font-mono text-[10px] text-stone-400">{job.company.name}</p>
        </div>
        <a
          href={applyHref}
          target={applyExternal ? '_blank' : undefined}
          rel={applyExternal ? 'noopener noreferrer' : undefined}
          className="shrink-0 font-mono text-xs tracking-widest uppercase py-2.5 px-5 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors"
        >
          Apply →
        </a>
      </div>
    </>
  );
}

function StructuredJobDescription({ description, companyName, jobTitle, location, categoryName }: {
  description: string; companyName: string; jobTitle: string; location: string; categoryName: string;
}) {
  const parsed = parseJobDescription(description);

  if (parsed.sections.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-4">About this role</h2>
          <p className="text-stone-700 leading-relaxed text-sm">
            {parsed.overview || `${companyName} is hiring a ${jobTitle} to join their team in ${location}. This is a ${categoryName.toLowerCase()} role in the nuclear power industry.`}
          </p>
        </div>
        {description.length > 200 && (
          <div>
            <h2 className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-4">Full description</h2>
            <p className="text-stone-600 leading-relaxed text-sm whitespace-pre-line">{description}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {parsed.overview && (
        <JobDescriptionSection label="About this role">
          <JobDescriptionBlock text={parsed.overview} />
        </JobDescriptionSection>
      )}
      {parsed.sections.map((section, index) => (
        <JobDescriptionSection key={index} label={formatSectionTitle(section.title)}>
          {section.type === 'list' ? (
            <ul className="space-y-3">
              {section.content.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3 text-stone-600 text-sm leading-relaxed">
                  <span className="text-yellow-500 mt-[0.35rem] flex-shrink-0 font-mono leading-none">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <JobDescriptionBlock text={section.content.join('\n\n')} />
          )}
        </JobDescriptionSection>
      ))}
    </div>
  );
}
