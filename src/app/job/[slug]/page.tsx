import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getRelatedJobs } from "@/lib/data/static";
import { getAnyJobBySlug } from "@/lib/data/employer";
import { getCategoryInfo } from "@/lib/categorize";
import { getStateBySlug } from "@/lib/states";
import {
  parseJobDescription,
  formatSectionTitle,
} from "@/lib/parseJobDescription";
import { formatSalary } from "@/lib/salary";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";
import {
  JobDescriptionBlock,
  JobDescriptionSection,
} from "@/components/job/JobDescriptionBlock";
import { JobFitBlock } from "@/components/job/JobFitBlock";
import { ApplicationForm } from "@/components/job/ApplicationForm";
import { ViewTracker } from "@/components/job/ViewTracker";
import { SaveJobButton } from "@/components/job/SaveJobButton";
import { FlagJobButton } from "@/components/job/FlagJobButton";
import { ShareJobButton } from "@/components/job/ShareJobButton";
import { groupSkills } from "@/lib/skills/taxonomy";
import { fitMetaDescription, hasUsableFit } from "@/lib/jobs/fit";
import { getPostedLabel } from "@/lib/jobs/dates";
import { getJobFacts, structuredText } from "@/lib/jobs/facts";
import { createClient } from "@/lib/supabase/server";
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbTruncated,
  BrowseTitle,
  BrowseBadge,
  BrowseTagLink,
  BrowseMetaLink,
} from "@/components/BrowsePageHeader";
import { JobAlertForm } from "@/components/JobAlertForm";
import {
  ExternalLinkButton,
  LinkButton,
} from "@/components/ui/LinkButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getAnyJobBySlug(slug);

  if (!job) return { title: "Job Not Found | Nuclear Hustle" };

  const titleCore = `${job.title} — ${job.company.name}`;
  const title =
    titleCore.length <= 50
      ? `${titleCore} | Nuclear Hustle`
      : `${titleCore.slice(0, 47)}…`;
  const description = fitMetaDescription(
    job.title,
    job.company.name,
    job.location,
    job.structured_description?.fit,
  );
  const url = `/job/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Nuclear Hustle",
      images: [
        {
          url: `/job/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/job/${slug}/opengraph-image`],
    },
  };
}

export default async function JobPage({ params }: PageProps) {
  const { slug } = await params;
  const job = await getAnyJobBySlug(slug);
  if (!job) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  let initialSaved = false;
  let defaultName = "";
  let defaultEmail = "";
  if (user) {
    const [{ data: saved }, { data: profile }] = await Promise.all([
      supabase
        .from("saved_jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("job_slug", slug)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    initialSaved = !!saved;
    defaultName = profile?.full_name ?? "";
    defaultEmail = profile?.email ?? user.email ?? "";
  }

  const isEmployerJob = job.isEmployerJob;
  const relatedJobs = getRelatedJobs(job, 4);
  const categoryInfo = getCategoryInfo(job.category);
  const stateInfo = job.state ? getStateBySlug(job.state) : null;
  const facts = getJobFacts(job);
  const salaryLabel = formatSalary(job.salary);
  const grouped = groupSkills(job.structured_description?.skills);
  const isFeatured =
    job.is_featured &&
    job.featured_until &&
    new Date(job.featured_until) > new Date();

  const locationParts = job.location.split(",").map((s: string) => s.trim());
  const city = locationParts[0] || job.location;
  const region = locationParts[1] || stateInfo?.name || "";

  const postedDate = new Date(job.scraped_at);
  const validThrough = new Date(postedDate);
  validThrough.setDate(validThrough.getDate() + 30);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.nuclearhustle.com";
  const employmentTypeMap: Record<string, string> = {
    "full-time": "FULL_TIME",
    "part-time": "PART_TIME",
    contract: "CONTRACTOR",
    temporary: "TEMPORARY",
    internship: "INTERN",
  };
  const employmentSchema =
    employmentTypeMap[job.employment_type?.toLowerCase() ?? ""] ||
    (facts.employmentType === "Contract"
      ? "CONTRACTOR"
      : facts.employmentType === "Part-time"
        ? "PART_TIME"
        : "FULL_TIME");

  const descriptionFallback = [
    `${job.company.name} is hiring a ${job.title} in ${job.location}.`,
    `This is a ${categoryInfo.name.toLowerCase()} role in the nuclear power industry.`,
  ].join(" ");

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || descriptionFallback,
    datePosted: job.scraped_at.split("T")[0],
    validThrough: validThrough.toISOString().split("T")[0],
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      sameAs: job.company.careers_url,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
        addressRegion: region,
        addressCountry: "US",
      },
    },
    directApply: isEmployerJob && job.application_type === "form",
    employmentType: employmentSchema,
    industry: "Nuclear Energy",
    identifier: {
      "@type": "PropertyValue",
      name: job.company.name,
      value: job.id,
    },
    url: `${siteUrl}/job/${job.slug}`,
  };

  if (job.salary?.min || job.salary?.max) {
    structuredData.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salary.min ?? job.salary.max,
        maxValue: job.salary.max ?? job.salary.min,
        unitText: job.salary.period === "hour" ? "HOUR" : "YEAR",
      },
    };
  }

  const applyUrl = job.url;
  const applyLabel =
    isEmployerJob && job.application_type === "form"
      ? "Apply for this role"
      : `Apply on ${job.company.name}`;
  const applyHref =
    isEmployerJob && job.application_type === "form" ? "#apply" : applyUrl;
  const applyExternal = !(isEmployerJob && job.application_type === "form");

  const breadcrumbItems = [
    { name: "Home", url: `${siteUrl}/` },
    { name: "Jobs", url: `${siteUrl}/jobs` },
    ...(stateInfo
      ? [{ name: stateInfo.name, url: `${siteUrl}/jobs/${stateInfo.slug}` }]
      : []),
    { name: job.title, url: `${siteUrl}/job/${job.slug}` },
  ];

  const factRows = [
    salaryLabel ? { label: "Salary", value: salaryLabel } : null,
    { label: "Location", value: facts.plant ? `${facts.plant.name}, ${job.location}` : job.location },
    facts.workMode ? { label: "Work mode", value: facts.workMode } : null,
    facts.schedule ? { label: "Schedule", value: facts.schedule } : null,
    facts.travel ? { label: "Travel", value: facts.travel } : null,
    facts.employmentType ? { label: "Type", value: facts.employmentType } : null,
    categoryInfo.name !== "Other" ? { label: "Field", value: categoryInfo.name } : null,
    { label: "Posted", value: getPostedLabel(job.scraped_at, "long") },
  ].filter(Boolean) as { label: string; value: string }[];

  const credentialSections = [
    { label: "Training and certifications", items: grouped.certifications },
    { label: "Security clearance", items: grouped.clearances },
    { label: "Skills and tools", items: grouped.skills },
  ].filter((section) => section.items.length > 0);

  const applyControl = applyExternal ? (
    <ExternalLinkButton
      href={applyHref}
      target="_blank"
      variant="primary"
      fullWidth
    >
      {applyLabel}
      <span className="sr-only"> (opens in a new tab)</span>
    </ExternalLinkButton>
  ) : (
    <LinkButton href={applyHref} variant="primary" fullWidth>
      {applyLabel}
    </LinkButton>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)),
        }}
      />

      {isEmployerJob && (
        <ViewTracker jobId={job.id.replace(/^employer-/, "")} />
      )}

      <div className="bg-canvas pb-24 md:pb-0">
        <BrowsePageHeader className="py-8 md:py-10">
          <BrowseBreadcrumb>
            <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
            <span aria-hidden="true">/</span>
            <BrowseBreadcrumbLink href="/jobs">Jobs</BrowseBreadcrumbLink>
            {stateInfo && (
              <>
                <span aria-hidden="true">/</span>
                <BrowseBreadcrumbLink href={`/jobs/${stateInfo.slug}`}>
                  {stateInfo.name}
                </BrowseBreadcrumbLink>
              </>
            )}
            <span aria-hidden="true">/</span>
            <BrowseBreadcrumbTruncated>{job.title}</BrowseBreadcrumbTruncated>
          </BrowseBreadcrumb>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {isFeatured && <BrowseBadge>Featured</BrowseBadge>}
            {isEmployerJob && <BrowseBadge>Direct employer</BrowseBadge>}
            {categoryInfo.name !== "Other" && (
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

          <p className="font-sans text-base text-inverse-ink/80">
            {isEmployerJob ? (
              <span className="font-semibold text-inverse-ink">
                {job.company.name}
              </span>
            ) : (
              <BrowseMetaLink href={`/companies/${job.company.id}`}>
                {job.company.name}
              </BrowseMetaLink>
            )}
            <span aria-hidden="true"> · </span>
            {facts.plant ? facts.plant.name : job.location}
            {salaryLabel && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-semibold text-inverse-ink">{salaryLabel}</span>
              </>
            )}
          </p>
        </BrowsePageHeader>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-10 md:grid-cols-3">
          <div className="min-w-0 space-y-10 md:col-span-2">
            {hasUsableFit(job.structured_description) &&
              job.structured_description?.fit && (
                <JobFitBlock fit={job.structured_description.fit} />
              )}

            {credentialSections.length > 0 && (
              <section>
                <h2 className="font-sans text-2xl font-bold text-ink">
                  Credentials that matter
                </h2>
                <div className="mt-4 space-y-5">
                  {credentialSections.map(({ label, items }) => (
                    <div key={label}>
                      <h3 className="font-mono text-xs uppercase tracking-widest text-secondary">
                        {label}
                      </h3>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {items.map((item) => (
                          <li
                            key={item}
                            className="border border-rule bg-surface px-2.5 py-1.5 font-mono text-xs text-ink"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {job.structured_description ? (
              [
                {
                  key: "qualifications",
                  label: "Required qualifications",
                  value: structuredText(job.structured_description.qualifications),
                },
                {
                  key: "about",
                  label: "About this role",
                  value: structuredText(job.structured_description.about),
                },
                {
                  key: "responsibilities",
                  label: "Responsibilities",
                  value: structuredText(job.structured_description.responsibilities),
                },
                {
                  key: "desired",
                  label: "Preferred qualifications",
                  value: structuredText(job.structured_description.desired),
                },
                {
                  key: "location_details",
                  label: "Location, schedule, and travel",
                  value: structuredText(job.structured_description.location_details),
                },
                {
                  key: "what_we_offer",
                  label: "What they offer",
                  value: structuredText(job.structured_description.what_we_offer),
                },
              ]
                .filter(({ value }) => value)
                .map(({ key, label, value }) => (
                  <JobDescriptionSection key={key} label={label}>
                    <JobDescriptionBlock text={value} />
                  </JobDescriptionSection>
                ))
            ) : job.description ? (
              <StructuredJobDescription
                description={job.description}
                companyName={job.company.name}
                jobTitle={job.title}
                location={job.location}
                categoryName={categoryInfo.name}
              />
            ) : (
              <p className="max-w-prose font-sans text-base leading-relaxed text-secondary">
                {job.company.name} is hiring a {job.title} in {job.location}.
                Use Apply to read the full posting on their careers site.
              </p>
            )}

            <section className="border-t border-rule pt-8">
              <h2 className="font-sans text-2xl font-bold text-ink">
                Similar roles
              </h2>
              <div className="mt-4">
                <JobAlertForm
                  heading={`Get ${categoryInfo.name.toLowerCase()} jobs by email`}
                  description="Monday digest. No spam."
                />
              </div>
            </section>

            {isEmployerJob && job.application_type === "form" && (
              <section id="apply" className="border-t border-rule pt-8">
                <h2 className="mb-6 font-sans text-2xl font-bold text-ink">
                  Apply for {job.title}
                </h2>
                <ApplicationForm
                  jobId={job.slug}
                  jobTitle={job.title}
                  companyName={job.company.name}
                  defaultName={defaultName}
                  defaultEmail={defaultEmail}
                />
              </section>
            )}
          </div>

          <aside className="md:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="card-raised hidden border border-control bg-raised p-5 md:block">
                {applyControl}
                {applyExternal && (
                  <p className="mt-2 text-center font-sans text-sm text-secondary">
                    Opens {job.company.name}’s careers page in a new tab.
                  </p>
                )}
                <div className="mt-3 flex justify-center gap-2">
                  <SaveJobButton
                    jobSlug={job.slug}
                    jobId={job.id}
                    initialSaved={initialSaved}
                    isAuthenticated={isAuthenticated}
                    showLabel
                  />
                  <ShareJobButton title={job.title} />
                </div>
              </div>

              <div className="border border-rule p-5">
                <h2 className="font-sans text-sm font-semibold text-ink">
                  Job details
                </h2>
                <dl className="mt-4 space-y-3">
                  {factRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 border-b border-rule pb-3 last:border-0 last:pb-0"
                    >
                      <dt className="font-mono text-xs uppercase tracking-widest text-secondary">
                        {row.label}
                      </dt>
                      <dd className="text-right font-sans text-sm font-semibold text-ink">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="border border-rule p-5">
                <h2 className="font-sans text-sm font-semibold text-ink">
                  About the company
                </h2>
                {isEmployerJob ? (
                  <p className="mt-2 font-sans text-sm font-semibold text-ink">
                    {job.company.name}
                  </p>
                ) : (
                  <Link
                    href={`/companies/${job.company.id}`}
                    className="mt-2 block font-sans text-sm font-semibold text-ink hover:underline"
                  >
                    {job.company.name}
                  </Link>
                )}
                {job.company.description && (
                  <p className="mt-2 font-sans text-sm leading-relaxed text-secondary">
                    {job.company.description}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <div className="flex justify-end border-t border-rule pt-6">
            <FlagJobButton jobSlug={job.slug} />
          </div>

          {relatedJobs.length > 0 && (
            <section className="mt-10 border-t border-rule pt-10 pb-16">
              <h2 className="mb-6 font-sans text-2xl font-bold text-ink">
                Related jobs
              </h2>
              <div className="border border-rule">
                {relatedJobs.map((relatedJob) => (
                  <Link
                    key={relatedJob.id}
                    href={`/job/${relatedJob.slug}`}
                    className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4 last:border-b-0 hover:bg-surface"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate font-sans text-base font-semibold text-ink">
                        {relatedJob.title}
                      </h3>
                      <p className="mt-0.5 truncate font-sans text-sm text-secondary">
                        {relatedJob.company.name} · {relatedJob.location}
                      </p>
                    </div>
                    <span aria-hidden="true" className="text-secondary">
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-40 flex items-center gap-3 border-t border-rule bg-canvas px-4 py-3 md:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold text-ink">
            {job.title}
          </p>
          <p className="truncate font-sans text-sm text-secondary">
            {job.company.name}
            {salaryLabel && <> · {salaryLabel}</>}
          </p>
        </div>
        <SaveJobButton
          jobSlug={job.slug}
          jobId={job.id}
          initialSaved={initialSaved}
          isAuthenticated={isAuthenticated}
        />
        {applyExternal ? (
          <ExternalLinkButton
            href={applyHref}
            target="_blank"
            variant="primary"
            size="compact"
          >
            Apply
            <span className="sr-only"> on {job.company.name}, opens in a new tab</span>
          </ExternalLinkButton>
        ) : (
          <LinkButton href={applyHref} variant="primary" size="compact">
            Apply
          </LinkButton>
        )}
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
      <section>
        <h2 className="mb-4 font-sans text-2xl font-bold text-ink">About this role</h2>
        <p className="max-w-prose font-sans text-base leading-relaxed text-secondary">
          {parsed.overview ||
            `${companyName} is hiring a ${jobTitle} in ${location}. This is a ${categoryName.toLowerCase()} role.`}
        </p>
      </section>
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
        <JobDescriptionSection
          key={index}
          label={formatSectionTitle(section.title)}
        >
          {section.type === "list" ? (
            <ul className="space-y-3">
              {section.content.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="flex items-start gap-3 font-sans text-base leading-relaxed text-secondary"
                >
                  <span className="mt-[0.45rem] shrink-0 font-mono leading-none text-ink" aria-hidden="true">
                    —
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <JobDescriptionBlock text={section.content.join("\n\n")} />
          )}
        </JobDescriptionSection>
      ))}
    </div>
  );
}
