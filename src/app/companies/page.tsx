import { Metadata } from 'next';
import Link from 'next/link';
import { getPlantsByCompany, getCompanyById } from '@/lib/data/static';
import { getAllCompanies, getAllJobs } from '@/lib/data/employer';
import { companyInitials, companyLogoSrc } from '@/lib/companies/logos';
import { CompanyMark } from '@/components/CompanyMark';
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbCurrent,
  BrowseLabel,
  BrowseTitle,
  BrowseMeta,
} from '@/components/BrowsePageHeader';

export const metadata: Metadata = {
  title: 'Nuclear Power Companies - Employers | Nuclear Hustle',
  description: 'Browse nuclear power companies hiring in the United States. Find job opportunities at major nuclear plant operators.',
  alternates: { canonical: '/companies' },
};

export default async function CompaniesPage() {
  const [companies, jobs] = await Promise.all([getAllCompanies(), getAllJobs()]);

  const jobCounts = new Map<string, number>();
  for (const job of jobs) {
    jobCounts.set(job.company_id, (jobCounts.get(job.company_id) || 0) + 1);
  }

  const companiesWithStats = companies.map((company) => ({
    ...company,
    plants: getPlantsByCompany(company.id),
    isDirectEmployer: !getCompanyById(company.id),
    jobCount: jobCounts.get(company.id) || 0,
    logo: companyLogoSrc(company),
  })).sort((a, b) => b.jobCount - a.jobCount);

  return (
    <div className="min-h-screen bg-canvas">
      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span aria-hidden="true">/</span>
          <BrowseBreadcrumbCurrent>Companies</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>
        <BrowseLabel>Directory</BrowseLabel>
        <BrowseTitle>Nuclear power companies</BrowseTitle>
        <BrowseMeta>
          <strong>{companies.length}</strong> companies in the US nuclear industry
        </BrowseMeta>
      </BrowsePageHeader>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="border border-rule">
          {companiesWithStats.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="group flex items-center justify-between gap-3 border-b border-rule px-4 py-4 last:border-b-0 hover:bg-surface sm:gap-6 sm:px-6 sm:py-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-16 shrink-0 items-center sm:w-36">
                  {company.logo ? (
                    <CompanyMark
                      src={company.logo}
                      width={144}
                      height={40}
                      className="h-8 w-auto max-w-full object-contain object-left"
                    />
                  ) : (
                    <span className="flex size-10 items-center justify-center border border-rule font-mono text-xs font-bold text-secondary">
                      {companyInitials(company.name)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-sans text-base font-semibold tracking-tight text-ink">
                    {company.name}
                  </h2>
                  <p className="mt-0.5 font-sans text-sm text-secondary">
                    {company.isDirectEmployer
                      ? 'Direct employer'
                      : `${company.plants.length} plant${company.plants.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 sm:gap-6">
                <span className="border border-rule px-3 py-1 font-sans text-sm text-secondary">
                  <span className="font-semibold tabular-nums text-ink">{company.jobCount}</span> job{company.jobCount !== 1 ? 's' : ''}
                </span>
                <span className="font-sans text-sm text-muted group-hover:text-ink" aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
