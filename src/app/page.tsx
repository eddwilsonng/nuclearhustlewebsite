import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { getJobsWithCompany, getCompanies, getActiveStates, getActiveCategories } from '@/lib/data/static';
import { JobCard } from '@/components/JobCard';
import { FeaturedJobsSection, FeaturedJobsSkeleton } from '@/components/FeaturedJobsSection';
import { JobAlertForm } from '@/components/JobAlertForm';
import { HiringStrip } from '@/components/HiringStrip';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Nuclear Hustle — Nuclear Power Plant Jobs',
  description: 'Find nuclear power plant jobs across the US. Browse reactor operator, engineering, and health physics roles at top operators. Updated daily.',
  keywords: ['nuclear jobs', 'nuclear power plant jobs', 'reactor operator jobs', 'nuclear engineer jobs', 'nuclear careers'],
  alternates: { canonical: '/' },
};


export default async function Home() {
  const jobs = getJobsWithCompany();
  const companies = getCompanies();
  const activeStates = getActiveStates();
  const activeCategories = getActiveCategories();
  const recentJobs = jobs.slice(0, 20);

  // Logged-in employers go straight to the posting flow (with its inline feature
  // option); everyone else is routed to employer signup first.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const postJobHref = user ? '/dashboard/jobs/new' : '/signup/employer';

  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="border-b border-[#CFC8BC] overflow-hidden relative min-h-[520px] md:min-h-[600px]">

        {/* Text — locked to same max-w-6xl grid as the nav */}
        <div className="max-w-6xl mx-auto px-6 relative z-10 py-16 md:py-24">
          <div className="max-w-[500px]">

            {/* Freshness badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-xs tracking-widest uppercase text-stone-500">
                Updated today — {jobs.length} open roles
              </span>
            </div>

            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-stone-900">Find your</span>
              <br />
              <span className="text-stone-900">next </span>
              <span className="text-yellow-500">nuclear</span>
              <br />
              <span className="text-stone-900">job.</span>
            </h1>

            <p className="mt-6 text-stone-500 text-lg leading-relaxed">
              The specialist job board for nuclear energy professionals.
              Roles at America&apos;s top operators — updated daily.
            </p>

            {/* Primary CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <Link
                href="/jobs"
                className="font-mono text-xs tracking-widest uppercase px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors text-center w-full sm:w-fit"
              >
                Browse {jobs.length} Jobs →
              </Link>
              <Link
                href="/companies"
                className="font-mono text-xs tracking-widest uppercase px-6 py-3 border border-[#CFC8BC] hover:border-stone-400 text-stone-600 hover:text-stone-900 transition-colors text-center w-full sm:w-fit"
              >
                View companies →
              </Link>
            </div>

            {/* Email alert capture */}
            <div className="mt-8 pt-8 border-t border-[#CFC8BC]">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-3">
                Get new jobs by email
              </p>
              <JobAlertForm />
            </div>

          </div>
        </div>

        {/* Image — absolutely positioned, right half of viewport */}
        <div className="hidden md:block absolute top-1/2 -translate-y-1/2 right-0 w-[58%] overflow-hidden">
          <Image
            src="/hero-banner.webp"
            alt="Nuclear power plant"
            width={1200}
            height={900}
            priority
            quality={80}
            sizes="58vw"
            className="w-full h-auto -ml-[18%]"
          />
        </div>

      </section>

      <HiringStrip />

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <span className="font-mono text-sm text-stone-400" aria-hidden="true">{'//'}</span>
      </div>

      {/* Featured Listings */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-500 mb-2">01</p>
              <h2 className="font-mono text-xl sm:text-2xl font-bold text-stone-900">Featured listings</h2>
              <p className="font-mono text-xs text-stone-400 mt-1">Sponsored roles from top operators</p>
            </div>
            <Link
              href={postJobHref}
              className="font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors shrink-0"
            >
              Feature a listing →
            </Link>
          </div>

          <Suspense fallback={<FeaturedJobsSkeleton />}>
            <FeaturedJobsSection postHref={postJobHref} />
          </Suspense>
        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <span className="font-mono text-sm text-stone-400" aria-hidden="true">{'//'}</span>
      </div>

      {/* Latest Jobs */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-500 mb-2">02</p>
              <h2 className="font-mono text-xl sm:text-2xl font-bold text-stone-900">Latest listings</h2>
            </div>
            <Link
              href="/jobs"
              className="font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors shrink-0"
            >
              All {jobs.length} jobs →
            </Link>
          </div>

          <div className="border border-[#CFC8BC]">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/jobs"
              className="font-mono text-xs tracking-widest uppercase px-6 py-3 border border-[#CFC8BC] hover:border-stone-400 text-stone-600 hover:text-stone-900 transition-colors inline-block"
            >
              View all {jobs.length} jobs →
            </Link>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <span className="font-mono text-sm text-stone-400" aria-hidden="true">{'//'}</span>
      </div>

      {/* Browse by Role */}
      <section className="py-16 border-t border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-stone-500 mb-2">03</p>
              <h2 className="font-mono text-2xl font-bold text-stone-900">Browse by role</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {activeCategories.map(({ category, name, count }) => (
              <Link
                key={category}
                href={`/jobs/role/${category}`}
                className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-[#CFC8BC] text-stone-600 hover:border-yellow-400 hover:text-stone-900 transition-colors"
              >
                {name}
                <span className="ml-2 text-stone-400">{count}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-1">
            <span className="font-mono text-xs text-stone-400">Don&apos;t see your role?</span>
            <Link
              href="/signup"
              className="font-mono text-xs text-stone-400 hover:text-stone-900 transition-colors underline underline-offset-2 w-fit"
            >
              Create a free alert and we&apos;ll notify you →
            </Link>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <span className="font-mono text-sm text-stone-400" aria-hidden="true">{'//'}</span>
      </div>

      {/* Browse by State */}
      <section className="py-16 border-t border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-500 mb-2">04</p>
          <h2 className="font-mono text-2xl font-bold text-stone-900 mb-8">Browse by state</h2>
          <div className="flex flex-wrap gap-3">
            {activeStates.slice(0, 12).map(({ state, count }) => (
              <Link
                key={state.slug}
                href={`/jobs/${state.slug}`}
                className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-[#CFC8BC] text-stone-600 hover:border-yellow-400 hover:text-stone-900 transition-colors"
              >
                {state.name}
                <span className="ml-2 text-stone-400">{count}</span>
              </Link>
            ))}
            {activeStates.length > 12 && (
              <Link
                href="/jobs"
                className="font-mono text-xs tracking-widest uppercase px-4 py-2 border border-dashed border-[#CFC8BC] text-stone-400 hover:border-stone-400 hover:text-stone-900 transition-colors"
              >
                +{activeStates.length - 12} more states →
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Dual CTA — forked by audience */}
      <section className="py-24 border-t border-[#CFC8BC]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-4">
            Nuclear energy is growing. Your next move starts here.
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-stone-900 mb-12 max-w-2xl">
            New reactors. Plant life extensions. A workforce shortage. Opportunity.
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl">
            {/* Job seeker */}
            <div className="border border-[#CFC8BC] p-8">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-3">For professionals</p>
              <h3 className="font-mono text-lg font-bold text-stone-900 mb-3">Find your next role</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-6">
                Browse {jobs.length} open positions at operators, contractors, and engineering firms across the US.
              </p>
              <Link
                href="/jobs"
                className="font-mono text-xs tracking-widest uppercase px-5 py-3 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-bold transition-colors inline-block"
              >
                Browse Jobs →
              </Link>
            </div>

            {/* Employer */}
            <div className="border border-[#CFC8BC] p-8">
              <p className="font-mono text-xs tracking-widest uppercase text-stone-400 mb-3">For employers</p>
              <h3 className="font-mono text-lg font-bold text-stone-900 mb-3">Hire nuclear talent</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-6">
                Post a role and reach qualified nuclear professionals actively looking for their next opportunity.
              </p>
              <Link
                href={postJobHref}
                className="font-mono text-xs tracking-widest uppercase px-5 py-3 border border-[#CFC8BC] hover:border-stone-400 text-stone-600 hover:text-stone-900 transition-colors inline-block"
              >
                Post a Job →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
