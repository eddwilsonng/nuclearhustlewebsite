import Link from 'next/link';
import { getActiveStates, getActiveCategories, getCompanies } from '@/lib/data/static';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sitemap | Nuclear Hustle',
  description: 'All pages on Nuclear Hustle — the specialist job board for nuclear energy professionals.',
};

const labelClass = 'font-mono text-[10px] tracking-widest uppercase text-stone-400 mb-4 block';
const linkClass = 'font-mono text-xs text-stone-600 hover:text-stone-900 transition-colors';

const STATIC_PAGES = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'All nuclear jobs' },
  { href: '/companies', label: 'Browse employers' },
  { href: '/status', label: 'US reactor fleet status' },
  { href: '/nuclear-salary', label: 'Nuclear salary guide' },
  { href: '/nuclear-skills', label: 'Nuclear skills report' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of use' },
];

const EMPLOYER_PAGES = [
  { href: '/signup/employer', label: 'Post a job' },
  { href: '/login', label: 'Employer login' },
];

export default function SitemapPage() {
  const activeStates = getActiveStates();
  const activeCategories = getActiveCategories();
  const companies = getCompanies();

  return (
    <div className="min-h-screen bg-[#EDE8DF]">
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="border-b border-[#CFC8BC] pb-8 mb-12">
          <p className={`${labelClass} mb-2`}>Site</p>
          <h1 className="font-mono text-2xl font-bold text-stone-900 tracking-tight">Sitemap</h1>
          <p className="font-mono text-xs text-stone-500 mt-2">
            Every public page on Nuclear Hustle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

          {/* Main pages */}
          <div>
            <span className={labelClass}>Main pages</span>
            <ul className="space-y-3">
              {STATIC_PAGES.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Jobs by role */}
          <div>
            <span className={labelClass}>Jobs by role</span>
            <ul className="space-y-3">
              {activeCategories.map(({ category, name, count }) => (
                <li key={category}>
                  <Link href={`/jobs/role/${category}`} className={linkClass}>
                    {name} jobs
                    <span className="text-stone-400 ml-1">({count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Jobs by state */}
          <div>
            <span className={labelClass}>Jobs by location</span>
            <ul className="space-y-3">
              {activeStates.map(({ state, count }) => (
                <li key={state.slug}>
                  <Link href={`/jobs/${state.slug}`} className={linkClass}>
                    Nuclear jobs in {state.name}
                    <span className="text-stone-400 ml-1">({count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Employers */}
          <div>
            <span className={labelClass}>For employers</span>
            <ul className="space-y-3">
              {EMPLOYER_PAGES.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className={linkClass}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Companies */}
          <div className="lg:col-span-2">
            <span className={labelClass}>Companies</span>
            <ul className="columns-2 gap-x-8 space-y-3">
              {companies.map((company) => (
                <li key={company.id} className="break-inside-avoid">
                  <Link href={`/companies/${company.id}`} className={linkClass}>
                    {company.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
