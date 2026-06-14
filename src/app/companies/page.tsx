import { Metadata } from 'next';
import Link from 'next/link';
import { getCompanies, getPlantsByCompany, getJobsByCompany } from '@/lib/data/static';

export const metadata: Metadata = {
  title: 'Nuclear Power Companies - Employers | Nuclear Hustle',
  description: 'Browse nuclear power companies hiring in the United States. Find job opportunities at major nuclear plant operators.',
  alternates: { canonical: 'https://nuclearhustle.com/companies' },
};

export default function CompaniesPage() {
  const companies = getCompanies();

  const companiesWithStats = companies.map((company) => ({
    ...company,
    plants: getPlantsByCompany(company.id),
    jobCount: getJobsByCompany(company.id).length,
  })).sort((a, b) => b.jobCount - a.jobCount);

  return (
    <div className="min-h-screen bg-[#EDE8DF]">
      {/* Header */}
      <div className="bg-[#EDE8DF] border-b border-[#CFC8BC] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-stone-500 mb-6">
            <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
            <span className="text-stone-400">//</span>
            <span className="text-stone-600">Companies</span>
          </nav>
          <p className="font-mono text-xs tracking-widest uppercase text-yellow-400 mb-2">Directory</p>
          <h1 className="font-mono text-3xl md:text-4xl font-bold text-stone-900 mb-3">
            Nuclear power companies
          </h1>
          <p className="font-mono text-sm text-stone-400">
            <strong className="text-stone-900">{companies.length}</strong> companies in the US nuclear industry
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="border border-[#CFC8BC]">
          {companiesWithStats.map((company, index) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              className="flex items-center justify-between gap-6 px-6 py-5 border-b border-[#CFC8BC] last:border-b-0 hover:bg-[#E5DFD5] transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 border border-[#CFC8BC] flex items-center justify-center">
                  <span className="font-mono text-xs font-bold text-stone-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-mono text-sm font-bold text-stone-900 group-hover:text-yellow-600 transition-colors">
                    {company.name}
                  </h2>
                  <p className="font-mono text-xs text-stone-400 mt-0.5">
                    {company.plants.length} plant{company.plants.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-6">
                <span className="font-mono text-xs tracking-widest uppercase border border-[#CFC8BC] px-3 py-1 text-stone-400">
                  {company.jobCount} job{company.jobCount !== 1 ? 's' : ''}
                </span>
                <span className="font-mono text-xs text-stone-300 group-hover:text-stone-900 transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
