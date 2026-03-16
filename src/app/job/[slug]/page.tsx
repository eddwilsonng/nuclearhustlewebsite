import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAnyJobBySlug, getRelatedJobs } from '@/lib/data';
import { getCategoryInfo } from '@/lib/categorize';
import { getStateBySlug } from '@/lib/states';
import { parseJobDescription, formatSectionTitle } from '@/lib/parseJobDescription';
import { ApplicationForm } from '@/components/job/ApplicationForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getAnyJobBySlug(slug);

  if (!job) {
    return { title: 'Job Not Found | Nuclear Hustle' };
  }

  const title = `${job.title} at ${job.company.name} - ${job.location} | Nuclear Hustle`;
  const description = `Apply for ${job.title} position at ${job.company.name} in ${job.location}. View details and apply directly on the company website.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  };
}

function getTimeSince(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
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

  // Map employment type to Google's accepted schema values
  const employmentTypeMap: Record<string, string> = {
    'full-time': 'FULL_TIME',
    'part-time': 'PART_TIME',
    'contract': 'CONTRACTOR',
    'temporary': 'TEMPORARY',
    'internship': 'INTERN',
  };
  const employmentType = employmentTypeMap[job.employment_type?.toLowerCase() ?? ''] || 'FULL_TIME';

  // Build a substantive fallback description for jobs without one
  const descriptionFallback = [
    `${job.company.name} is hiring a ${job.title} to join their team in ${job.location}.`,
    `This is a ${categoryInfo.name.toLowerCase()} role in the nuclear power industry.`,
    categoryInfo.description,
    `Responsibilities will include work typical of a ${job.title} at a nuclear power facility, ensuring safe and efficient plant operations in compliance with NRC regulations.`,
    `To apply, visit ${job.company.name}'s careers page directly. Nuclear Hustle aggregates open positions from major US nuclear operators to help professionals find opportunities in the industry.`,
  ].join(' ');

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || descriptionFallback,
    datePosted: job.scraped_at.split('T')[0],
    validThrough: validThrough.toISOString().split('T')[0],
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      sameAs: job.company.careers_url,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: city,
        addressRegion: region,
        addressCountry: 'US',
      },
    },
    directApply: false,
    employmentType,
    industry: 'Nuclear Energy',
    identifier: { '@type': 'PropertyValue', name: job.company.name, value: job.id },
    url: `${siteUrl}/job/${job.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-white">
        {/* Breadcrumbs */}
        <div className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <nav className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-gray-400">
              <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
              <span className="text-gray-200">//</span>
              <Link href="/jobs" className="hover:text-gray-900 transition-colors">Jobs</Link>
              {stateInfo && (
                <>
                  <span className="text-gray-200">//</span>
                  <Link href={`/jobs/${stateInfo.slug}`} className="hover:text-gray-900 transition-colors">
                    {stateInfo.name}
                  </Link>
                </>
              )}
              <span className="text-gray-200">//</span>
              <span className="text-gray-900 truncate max-w-[200px]">{job.title}</span>
            </nav>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Left: Job detail */}
            <div className="md:col-span-2">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {isEmployerJob && (
                  <span className="font-mono text-xs tracking-widest uppercase border border-yellow-300 text-yellow-600 px-3 py-1">
                    Direct Employer
                  </span>
                )}
                <Link
                  href={`/jobs/role/${job.category}`}
                  className="font-mono text-xs tracking-widest uppercase border border-gray-200 text-gray-500 px-3 py-1 hover:border-yellow-400 hover:text-gray-900 transition-colors"
                >
                  {categoryInfo.name}
                </Link>
                {stateInfo && (
                  <Link
                    href={`/jobs/${stateInfo.slug}`}
                    className="font-mono text-xs tracking-widest uppercase border border-gray-200 text-gray-500 px-3 py-1 hover:border-yellow-400 hover:text-gray-900 transition-colors"
                  >
                    {stateInfo.name}
                  </Link>
                )}
                <span className="font-mono text-xs tracking-widest uppercase border border-gray-100 text-gray-400 px-3 py-1" suppressHydrationWarning>
                  {getTimeSince(job.scraped_at)}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-mono text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {job.title}
              </h1>

              {/* Company / Location */}
              <div className="font-mono text-sm text-gray-400 mb-10">
                {isEmployerJob ? (
                  <span>{job.company.name}</span>
                ) : (
                  <Link href={`/companies/${job.company.id}`} className="hover:text-yellow-600 transition-colors">
                    {job.company.name}
                  </Link>
                )}
                <span className="mx-2 text-gray-200">//</span>
                <span>{job.location}</span>
              </div>

              {/* Description */}
              <div className="border-t border-gray-100 pt-10">
                {job.structured_description ? (
                  <div className="space-y-8">
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
                        <div key={key}>
                          <h3 className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-3">
                            {label}
                          </h3>
                          <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                            {value}
                          </div>
                        </div>
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
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    <p>
                      {job.company.name} is hiring a <strong>{job.title}</strong> to join their team in {job.location}.
                      This is a {categoryInfo.name.toLowerCase()} role in the nuclear power industry.
                    </p>
                    <p>{categoryInfo.description}</p>
                    <p>Click the apply button to view the full job description and submit your application on {job.company.name}&apos;s careers website.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Apply sidebar */}
            <div className="md:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Apply CTA */}
                {isEmployerJob && job.application_type === 'form' ? (
                  <div className="border border-gray-100 p-6">
                    <a
                      href="#apply"
                      className="block w-full text-center font-mono text-xs tracking-widest uppercase py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold transition-colors"
                    >
                      Apply for this role ↓
                    </a>
                    <p className="mt-3 font-mono text-xs text-gray-400 leading-relaxed">
                      Submit your application directly to {job.company.name}.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-100 p-6">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center font-mono text-xs tracking-widest uppercase py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold transition-colors"
                    >
                      Apply on {job.company.name} →
                    </a>
                    <p className="mt-3 font-mono text-xs text-gray-400 leading-relaxed">
                      You&apos;ll be redirected to {job.company.name}&apos;s careers page to complete your application.
                    </p>
                  </div>
                )}

                {/* Company info */}
                <div className="border border-gray-100 p-6">
                  <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-3">Company</p>
                  {isEmployerJob ? (
                    <p className="font-mono text-sm font-semibold text-gray-900">{job.company.name}</p>
                  ) : (
                    <Link
                      href={`/companies/${job.company.id}`}
                      className="font-mono text-sm font-semibold text-gray-900 hover:text-yellow-600 transition-colors"
                    >
                      {job.company.name} →
                    </Link>
                  )}
                  {job.company.description && (
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                      {job.company.description}
                    </p>
                  )}
                  {job.company.careers_url && (
                    <a
                      href={job.company.careers_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-3 font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      Website ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Jobs */}
          {relatedJobs.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-100">
              <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">More like this</p>
              <h2 className="font-mono text-xl font-bold text-gray-900 mb-6">Related jobs</h2>
              <div className="border border-gray-100">
                {relatedJobs.map((relatedJob) => (
                  <Link
                    key={relatedJob.id}
                    href={`/job/${relatedJob.slug}`}
                    className="flex items-center justify-between gap-4 px-4 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group"
                  >
                    <div>
                      <h3 className="font-mono text-sm font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">{relatedJob.title}</h3>
                      <p className="font-mono text-xs text-gray-400 mt-0.5">{relatedJob.company.name} // {relatedJob.location}</p>
                    </div>
                    <span className="font-mono text-xs text-gray-300">→</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Application form — shown at bottom for email-based employer jobs */}
          {isEmployerJob && job.application_type === 'form' && (
            <div id="apply" className="mt-16 pt-12 border-t border-gray-100">
              <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">Apply now</p>
              <h2 className="font-mono text-xl font-bold text-gray-900 mb-8">
                Apply for {job.title}
              </h2>
              <div className="max-w-xl">
                <ApplicationForm
                  jobId={job.slug}
                  jobTitle={job.title}
                  companyName={job.company.name}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function StructuredJobDescription({
  description,
  companyName,
  jobTitle,
  location,
  categoryName,
}: {
  description: string;
  companyName: string;
  jobTitle: string;
  location: string;
  categoryName: string;
}) {
  const parsed = parseJobDescription(description);

  if (parsed.sections.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4">About this role</h2>
          <p className="text-gray-700 leading-relaxed">
            {parsed.overview || `${companyName} is hiring a ${jobTitle} to join their team in ${location}. This is a ${categoryName.toLowerCase()} role in the nuclear power industry.`}
          </p>
        </div>
        {description.length > 200 && (
          <div>
            <h2 className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4">Full description</h2>
            <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{description}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {parsed.overview && (
        <div>
          <h2 className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4">About this role</h2>
          <p className="text-gray-700 leading-relaxed">{parsed.overview}</p>
        </div>
      )}

      {parsed.sections.map((section, index) => (
        <div key={index}>
          <h2 className="font-mono text-xs tracking-widest uppercase text-gray-400 mb-4">
            {formatSectionTitle(section.title)}
          </h2>
          {section.type === 'list' ? (
            <ul className="space-y-2">
              {section.content.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3 text-gray-700 text-sm leading-relaxed">
                  <span className="text-yellow-400 mt-1.5 flex-shrink-0 font-mono">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3">
              {section.content.map((paragraph, pIndex) => (
                <p key={pIndex} className="text-gray-700 leading-relaxed text-sm">{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
