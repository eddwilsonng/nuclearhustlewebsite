import Link from "next/link";
import { getJobsForList, getCompanies, getActiveStates, getActiveCategories } from "@/lib/data/static";
import { JobCard } from "@/components/JobCard";
import { FeaturedJobsSection, FeaturedJobsSkeleton } from "@/components/FeaturedJobsSection";
import { JobAlertForm } from "@/components/JobAlertForm";
import { HiringStrip } from "@/components/HiringStrip";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Suspense } from "react";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuclear Hustle — Nuclear Power Plant Jobs",
  description:
    "Find nuclear power plant jobs across the US. Browse reactor operator, engineering, and health physics roles at top operators. Updated daily.",
  keywords: [
    "nuclear jobs",
    "nuclear power plant jobs",
    "reactor operator jobs",
    "nuclear engineer jobs",
    "nuclear careers",
  ],
  alternates: { canonical: "/" },
};

export default async function Home() {
  const jobs = getJobsForList();
  const companies = getCompanies();
  const activeStates = getActiveStates();
  const activeCategories = getActiveCategories();
  const recentJobs = jobs.slice(0, 12);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const postJobHref = user ? "/dashboard/jobs/new" : "/signup/employer";

  return (
    <div>
      <section className="relative overflow-hidden border-b border-rule motif-grid">
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="relative z-10 max-w-[34rem]">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              {jobs.length} open roles · updated today
            </p>
            <h1 className="mt-4 font-sans text-4xl leading-tight font-bold text-ink md:text-5xl lg:text-6xl text-balance">
              Find your next nuclear job.
            </h1>
            <p className="mt-5 max-w-md font-sans text-lg leading-relaxed text-secondary text-pretty">
              Specialist board for operators, engineers, health physicists, and
              plant crews. Roles from America’s nuclear operators, updated daily.
            </p>

            <form
              action="/jobs"
              method="get"
              className="mt-8 flex flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="home-search" className="sr-only">
                Search jobs
              </label>
              <Input
                id="home-search"
                name="q"
                type="search"
                placeholder="Role, plant, or city"
                className="sm:flex-1"
              />
              <Button type="submit" variant="primary" size="large">
                Search jobs
              </Button>
            </form>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <LinkButton href="/jobs" variant="primary" size="large">
                Browse {jobs.length} jobs
              </LinkButton>
              <Link
                href="/companies"
                className="font-sans text-sm text-secondary underline-offset-2 hover:text-ink hover:underline"
              >
                View companies →
              </Link>
            </div>
          </div>

          <div className="pointer-events-none absolute top-1/2 right-6 z-0 hidden w-[min(54%,40rem)] -translate-y-1/2 overflow-hidden md:block">
            <Image
              src="/hero-banner.webp"
              alt=""
              width={1376}
              height={768}
              priority
              quality={80}
              sizes="40rem"
              className="h-auto w-[216%] max-w-none -ml-[112%]"
            />
          </div>
        </div>
      </section>

      <HiringStrip />

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-sans text-2xl font-bold text-ink">
                Featured listings
              </h2>
              <p className="mt-1 font-sans text-sm text-secondary">
                Sponsored roles from operators hiring now
              </p>
            </div>
            <LinkButton href={postJobHref} variant="secondary" size="compact">
              Feature a listing
            </LinkButton>
          </div>
          <Suspense fallback={<FeaturedJobsSkeleton />}>
            <FeaturedJobsSection postHref={postJobHref} />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-rule py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-sans text-2xl font-bold text-ink">
              Latest listings
            </h2>
            <Link
              href="/jobs"
              className="font-sans text-sm text-secondary hover:text-ink"
            >
              All {jobs.length} jobs →
            </Link>
          </div>
          <div className="border border-rule">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-6 font-sans text-2xl font-bold text-ink">
            Browse by role
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeCategories.map(({ category, name, count }) => (
              <Link
                key={category}
                href={`/jobs/role/${category}`}
                className="border border-control px-4 py-2 font-sans text-sm text-secondary hover:border-ink hover:text-ink"
              >
                {name}
                <span className="ml-2 font-mono text-xs tabular-nums text-ink">
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-6 font-sans text-2xl font-bold text-ink">
            Browse by state
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeStates.slice(0, 12).map(({ state, count }) => (
              <Link
                key={state.slug}
                href={`/jobs/${state.slug}`}
                className="border border-control px-4 py-2 font-sans text-sm text-secondary hover:border-ink hover:text-ink"
              >
                {state.name}
                <span className="ml-2 font-mono text-xs tabular-nums text-ink">
                  {count}
                </span>
              </Link>
            ))}
            {activeStates.length > 12 && (
              <Link
                href="/jobs"
                className="border border-dashed border-control px-4 py-2 font-sans text-sm text-secondary hover:text-ink"
              >
                +{activeStates.length - 12} more states
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-rule py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div>
            <h2 className="font-sans text-3xl font-bold text-ink">
              New reactors. Life extensions. A workforce shortage.
            </h2>
            <p className="mt-4 font-sans text-base leading-relaxed text-secondary">
              {jobs.length} open roles across {companies.length} employers.
              Get the Monday digest or post a listing.
            </p>
            <div className="mt-8">
              <JobAlertForm />
            </div>
          </div>
          <div className="border border-rule p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              For employers
            </p>
            <h3 className="mt-2 font-sans text-xl font-bold text-ink">
              Hire nuclear talent
            </h3>
            <p className="mt-3 font-sans text-sm leading-relaxed text-secondary">
              Post a role in front of people already looking at nuclear work.
            </p>
            <LinkButton href={postJobHref} variant="secondary" className="mt-6">
              Post a job
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
