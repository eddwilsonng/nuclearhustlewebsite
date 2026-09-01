import { Metadata } from 'next';
import Link from 'next/link';
import { getCompanies, getPlantsByCompany, getJobsByCompany } from '@/lib/data/static';
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

export default function CompaniesPage() {
  const companies = getCompanies();

  const companiesWithStats = companies.map((company) => ({
    ...company,
    plants: getPlantsByCompany(company.id),
    jobCount: getJobsByCompany(company.id).length,
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
          {companiesWithStats.map((company, index) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="group flex items-center justify-between gap-6 border-b border-rule px-6 py-5 last:border-b-0 hover:bg-surface"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center border border-rule">
                  <span className="font-mono text-xs font-bold text-secondary">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-sans text-base font-semibold tracking-tight text-ink">
                    {company.name}
                  </h2>
                  <p className="mt-0.5 font-sans text-sm text-secondary">
                    {company.plants.length} plant{company.plants.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-6">
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
