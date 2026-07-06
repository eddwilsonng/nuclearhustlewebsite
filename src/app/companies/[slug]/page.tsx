import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCompanies, getCompanyById, getPlantsByCompany, getJobsByCompany, toJobListItem } from '@/lib/data/static';
import { JobCard } from '@/components/JobCard';
import { Sidebar, SidebarSection, SidebarNavList } from '@/components/sidebar/Sidebar';
import {
  BrowsePageHeader,
  BrowseBreadcrumb,
  BrowseBreadcrumbLink,
  BrowseBreadcrumbCurrent,
  BrowseLabel,
  BrowseTitle,
  BrowseMeta,
} from '@/components/BrowsePageHeader';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const companies = getCompanies();
  return companies.map((company) => ({ slug: company.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyById(slug);

  if (!company) return { title: 'Company Not Found | Nuclear Hustle' };

  const jobs = getJobsByCompany(slug);
  const title = `${company.name} Nuclear Jobs — ${jobs.length} Positions | Nuclear Hustle`;
  const description = `Find ${jobs.length} nuclear jobs at ${company.name}. Browse open positions and apply today.`;

  const url = `/companies/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'Nuclear Hustle' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const company = getCompanyById(slug);

  if (!company) notFound();

  const plants = getPlantsByCompany(slug);
  const jobs = getJobsByCompany(slug);
  const otherCompanies = getCompanies().filter((c) => c.id !== slug).slice(0, 6);

  const plantsByRegion = plants.reduce((acc, plant) => {
    if (!acc[plant.region]) acc[plant.region] = [];
    acc[plant.region].push(plant);
    return acc;
  }, {} as Record<string, typeof plants>);

  return (
    <div className="min-h-screen bg-[#EDE8DF]">
      <BrowsePageHeader>
        <BrowseBreadcrumb>
          <BrowseBreadcrumbLink href="/">Home</BrowseBreadcrumbLink>
          <span className="text-stone-500">//</span>
          <BrowseBreadcrumbLink href="/companies">Companies</BrowseBreadcrumbLink>
          <span className="text-stone-500">//</span>
          <BrowseBreadcrumbCurrent>{company.name}</BrowseBreadcrumbCurrent>
        </BrowseBreadcrumb>
        <BrowseLabel>Company</BrowseLabel>
        <BrowseTitle>{company.name}</BrowseTitle>
        <BrowseMeta>
          <strong>{jobs.length}</strong> open position{jobs.length !== 1 ? 's' : ''}
          <span className="text-stone-500 mx-2">//</span>
          <strong>{plants.length}</strong> nuclear plant{plants.length !== 1 ? 's' : ''}
        </BrowseMeta>
      </BrowsePageHeader>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-12">

          {/* Main: Jobs */}
          <div className="lg:col-span-2">
            <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-4">Open positions</p>
            {jobs.length > 0 ? (
              <div className="border border-[#CFC8BC]">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={toJobListItem(job)} />
                ))}
              </div>
            ) : (
              <div className="border border-[#CFC8BC] p-8 text-center">
                <p className="font-mono text-sm text-stone-400 mb-4">No open positions currently listed.</p>
                <a
                  href={company.careers_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs tracking-widest uppercase text-yellow-700 hover:text-yellow-500 transition-colors"
                >
                  Visit {company.name} careers page ↗
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar>
            <SidebarSection label="Info">
              <a
                href={company.careers_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors"
              >
                Careers page ↗
              </a>
            </SidebarSection>

            {plants.length > 0 && (
              <SidebarSection label="Nuclear plants">
                <div className="space-y-4">
                  {Object.entries(plantsByRegion).map(([region, regionPlants]) => (
                    <div key={region}>
                      <p className="font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-2">{region}</p>
                      <ul className="space-y-1">
                        {regionPlants.map((plant) => (
                          <li key={plant.id} className="font-sans text-sm text-stone-500">
                            — {plant.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SidebarSection>
            )}

            <SidebarSection label="Other companies" footerHref="/companies" footerLabel="All companies →">
              <SidebarNavList
                items={otherCompanies.map((c) => ({
                  href: `/companies/${c.id}`,
                  label: c.name,
                }))}
              />
            </SidebarSection>
          </Sidebar>
        </div>
      </main>
    </div>
  );
}
