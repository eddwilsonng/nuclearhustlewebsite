import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCompanies, getCompanyById, getPlantsByCompany, getJobsByCompany } from '@/lib/data';
import { JobCard } from '@/components/JobCard';

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
  const title = `${company.name} Nuclear Jobs - ${jobs.length} Positions | Nuclear Hustle`;
  const description = `Find nuclear power plant jobs at ${company.name}. Browse ${jobs.length} open positions and apply today.`;

  return { title, description, openGraph: { title, description, type: 'website' } };
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-gray-400 mb-6">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span className="text-gray-200">//</span>
            <Link href="/companies" className="hover:text-gray-900 transition-colors">Companies</Link>
            <span className="text-gray-200">//</span>
            <span className="text-gray-900">{company.name}</span>
          </nav>
          <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">Company</p>
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {company.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-gray-400">
            <span><strong className="text-gray-900">{jobs.length}</strong> open position{jobs.length !== 1 ? 's' : ''}</span>
            <span className="text-gray-200">//</span>
            <span><strong className="text-gray-900">{plants.length}</strong> nuclear plant{plants.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-12">

          {/* Main: Jobs */}
          <div className="lg:col-span-2">
            <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-4">Open positions</p>
            {jobs.length > 0 ? (
              <div className="border border-gray-100">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="border border-gray-100 p-8 text-center">
                <p className="font-mono text-sm text-gray-400 mb-4">No open positions currently listed.</p>
                <a
                  href={company.careers_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs tracking-widest uppercase text-yellow-600 hover:text-yellow-700 transition-colors"
                >
                  Visit {company.name} careers page ↗
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Company info */}
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-4">Info</p>
              <a
                href={company.careers_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors"
              >
                Careers page ↗
              </a>
            </div>

            {/* Plants */}
            {plants.length > 0 && (
              <div>
                <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-4">Nuclear plants</p>
                <div className="space-y-4">
                  {Object.entries(plantsByRegion).map(([region, regionPlants]) => (
                    <div key={region}>
                      <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-2">{region}</p>
                      <ul className="space-y-1">
                        {regionPlants.map((plant) => (
                          <li key={plant.id} className="font-mono text-xs text-gray-600">
                            — {plant.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other companies */}
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-gray-300 mb-4">Other companies</p>
              <ul className="space-y-2">
                {otherCompanies.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/companies/${c.id}`}
                      className="font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/companies"
                className="block font-mono text-xs tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors mt-4"
              >
                All companies →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
