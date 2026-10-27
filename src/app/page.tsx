import Link from "next/link";
import {
  getAllJobsForList,
  getAllCompanies,
  getAllActiveStates,
  getAllActiveCategories,
} from "@/lib/data/employer";
import { companyLogoSrc } from "@/lib/companies/logos";
import { CompanyMark } from "@/components/CompanyMark";
import { getJobsByCompany } from "@/lib/data/static";
import { JobAlertForm } from "@/components/JobAlertForm";
import { HomeFaq } from "@/components/HomeFaq";
import { LinkButton } from "@/components/ui/LinkButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { formatSalary } from "@/lib/salary";
import { getPostedLabel } from "@/lib/jobs/dates";
import { isLiveFeatured } from "@/lib/jobs/sort";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import type { JobListItem } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nuclear Hustle | Job Board Built for Nuclear Professionals",
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

const CATEGORY_LABELS: Record<string, string> = {
  operations: "Operations",
  engineering: "Engineering",
  maintenance: "Maintenance",
  "health-physics": "Health Physics",
  security: "Security",
  training: "Training",
  administrative: "Admin",
  other: "—",
};

export default async function Home() {
  const [jobs, companies, activeStates, activeCategories] = await Promise.all([
    getAllJobsForList(),
    getAllCompanies(),
    getAllActiveStates(),
    getAllActiveCategories(),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const postJobHref = user ? "/dashboard/jobs/new" : "/signup/employer";

  const latest = jobs.slice(0, 10);
  const jobCount = jobs.length.toLocaleString("en-US");
  const updated = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const topStates = activeStates.slice(0, 8);
  const maxStateCount = Math.max(1, ...topStates.map((s) => s.count));
  const topCategories = [...activeCategories]
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  return (
    <div>
      <div className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-2.5 font-mono text-xs text-secondary md:flex md:flex-wrap md:items-baseline md:gap-x-6 md:py-2">
          <div className="flex items-baseline justify-between gap-x-3 md:contents">
            <span className="whitespace-nowrap">
              <span className="tabular-nums text-ink">{jobCount}</span>
              <span className="md:hidden"> roles</span>
              <span className="hidden md:inline"> open roles</span>
            </span>
            <span className="whitespace-nowrap">
              <span className="tabular-nums text-ink">{companies.length}</span>{" "}
              operators
            </span>
            <span className="whitespace-nowrap">
              <span className="tabular-nums text-ink">{activeStates.length}</span>{" "}
              states
            </span>
          </div>
          <span className="mt-1 block whitespace-nowrap text-right md:mt-0 md:ml-auto md:inline md:text-left">
            Updated <span className="text-ink">{updated}</span>
          </span>
        </div>
      </div>

      <section className="border-b border-rule">
        <div className="mx-auto max-w-6xl px-6 pt-14 pb-10 md:pt-20">
          <div className="max-w-3xl">
            <h1 className="headline-reveal font-sans text-4xl leading-[1.05] font-bold tracking-tight text-ink md:text-6xl text-balance">
              Find your next nuclear job.
            </h1>
            <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-secondary text-pretty">
              Specialist board for operators, engineers, health physicists, and
              plant crews. Roles from America&rsquo;s nuclear operators, updated
              daily.
            </p>

            <form
              action="/jobs"
              method="get"
              className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="home-search" className="sr-only">
                Search jobs
              </label>
              <Input
                id="home-search"
                name="q"
                type="search"
                placeholder="Role, operator, plant, or city"
                className="sm:flex-1"
              />
              <Button type="submit" variant="primary" size="large">
                Search {jobCount} roles
              </Button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-14">
          <RolesTable jobs={latest} total={jobCount} />
        </div>
      </section>

      <OperatorWall />

      <JobAlertForm layout="bar" />

      <section className="border-b border-rule py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <h2 className="font-sans text-2xl font-bold tracking-tight text-ink">
              Where the jobs are
            </h2>
            <p className="mt-1 font-sans text-sm text-secondary">
              Browse open roles by state or by field of work.
            </p>

            <ol className="mt-6 divide-y divide-rule border-y border-rule">
              {topStates.map(({ state, count }, i) => (
                <li key={state.slug}>
                  <Link
                    href={`/jobs/${state.slug}`}
                    className="group flex items-center gap-4 py-3 transition-colors hover:bg-surface"
                  >
                    <span className="w-6 shrink-0 font-mono text-xs tabular-nums text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="w-40 shrink-0 font-sans text-sm font-semibold text-ink group-hover:underline underline-offset-4">
                      {state.name}
                    </span>
                    <span className="hidden flex-1 sm:block" aria-hidden="true">
                      <span className="block h-1.5 bg-surface">
                        <span
                          className="block h-full bg-signal"
                          style={{
                            width: `${Math.round((count / maxStateCount) * 100)}%`,
                          }}
                        />
                      </span>
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-sm tabular-nums text-ink">
                      {count.toLocaleString("en-US")}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <Link
              href="/outages"
              className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-secondary hover:text-ink"
            >
              View the outage schedule →
            </Link>
          </div>

          <div>
            <h2 className="font-sans text-2xl font-bold tracking-tight text-ink">
              By field
            </h2>
            <ul className="mt-6 divide-y divide-rule border-y border-rule">
              {topCategories.map(({ category, name, count }) => (
                <li key={category}>
                  <Link
                    href={`/jobs/role/${category}`}
                    className="flex items-baseline justify-between gap-4 py-3 hover:bg-surface"
                  >
                    <span className="font-sans text-sm text-ink hover:underline underline-offset-4">
                      {name}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-secondary">
                      {count.toLocaleString("en-US")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <HomeFaq />

      <section className="py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              Job alerts
            </p>
            <h2 className="mt-3 font-sans text-3xl font-bold tracking-tight text-ink text-balance">
              New roles every Monday.
            </h2>
            <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-secondary">
              We group that week&rsquo;s new roles by region and send them
              straight to your inbox.
            </p>
            <div className="mt-8">
              <JobAlertForm description="" />
            </div>
          </div>
          <div className="border border-rule bg-raised p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-secondary">
              For operators &amp; vendors
            </p>
            <h3 className="mt-2 font-sans text-xl font-bold tracking-tight text-ink">
              Hire where nuclear people already look
            </h3>
            <p className="mt-3 font-sans text-sm leading-relaxed text-secondary">
              Put a role in front of licensed operators, engineers, and HP techs
              who are here for one reason.
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

const WALL_OPERATORS = [
  { id: "constellation", name: "Constellation" },
  { id: "duke", name: "Duke Energy" },
  { id: "dominion", name: "Dominion" },
  { id: "entergy", name: "Entergy" },
  { id: "nextera", name: "NextEra" },
  { id: "tva", name: "TVA" },
] as const;

function OperatorWall() {
  const operators = WALL_OPERATORS.flatMap((op) => {
    const jobCount = getJobsByCompany(op.id).length;
    const src = companyLogoSrc({ id: op.id });
    if (jobCount === 0 || !src) return [];
    return [{ ...op, jobCount, src }];
  });

  if (operators.length === 0) return null;

  const cellWidth =
    operators.length >= 6
      ? "md:w-1/3 lg:w-1/6"
      : operators.length === 4
        ? "md:w-1/4"
        : operators.length === 3
          ? "md:w-1/3"
          : operators.length === 2
            ? "md:w-1/2"
            : "md:w-1/3 lg:w-1/5";

  return (
    <section className="border-b border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-secondary">
            Hiring from America&rsquo;s largest operators
          </h2>
          <Link
            href="/companies"
            className="shrink-0 whitespace-nowrap font-mono text-xs uppercase tracking-widest text-ink hover:underline underline-offset-4"
          >
            All operators →
          </Link>
        </div>

        <ul className="flex flex-col border-t border-l border-rule md:flex-row md:flex-wrap">
          {operators.map((op) => (
            <li
              key={op.id}
              className={`w-full border-r border-b border-rule ${cellWidth}`}
            >
              <Link
                href={`/companies/${op.id}`}
                className="group flex h-full items-center gap-3 bg-surface px-4 py-3.5 transition-colors duration-150 hover:bg-canvas md:min-h-36 md:flex-col md:justify-center md:gap-2 md:py-5 md:text-center"
              >
                <span className="flex h-8 w-16 shrink-0 items-center justify-start md:w-full md:justify-center">
                  <CompanyMark
                    src={op.src}
                    width={160}
                    height={40}
                    className="h-8 w-auto max-w-16 object-contain opacity-85 grayscale transition duration-150 group-hover:opacity-100 group-hover:grayscale-0 md:max-w-36"
                  />
                </span>
                <span className="min-w-0 flex-1 font-sans text-sm font-semibold text-ink md:flex-none">
                  {op.name}
                </span>
                <span className="shrink-0 font-mono text-xs text-secondary">
                  <span className="tabular-nums text-ink">{op.jobCount}</span>{" "}
                  open
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function RolesTable({ jobs, total }: { jobs: JobListItem[]; total: string }) {
  return (
    <div className="border border-rule bg-canvas">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-rule px-4 py-2.5">
        <h2 className="whitespace-nowrap font-mono text-xs uppercase tracking-widest text-secondary">
          Latest on the board
        </h2>
        <Link
          href="/jobs"
          className="whitespace-nowrap font-mono text-xs uppercase tracking-widest text-ink hover:underline underline-offset-4"
        >
          All {total} →
        </Link>
      </div>

      <div className="hidden border-b border-rule px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted md:grid md:grid-cols-[minmax(0,1fr)_10rem_7rem_8rem_5rem] md:gap-4">
        <span>Role</span>
        <span>Location</span>
        <span>Field</span>
        <span>Pay</span>
        <span className="text-right">Posted</span>
      </div>

      <ul>
        {jobs.map((job) => {
          const salary = formatSalary(job.salary);
          const field = CATEGORY_LABELS[job.category] ?? job.category;
          const showField = field !== "—";
          const featured = isLiveFeatured(job);
          return (
            <li
              key={job.id}
              className={`border-b border-rule last:border-b-0 ${
                featured ? "border-l-2 border-l-signal" : ""
              }`}
            >
              <Link
                href={`/job/${job.slug}`}
                className="block px-4 py-3.5 transition-colors hover:bg-surface md:grid md:grid-cols-[minmax(0,1fr)_10rem_7rem_8rem_5rem] md:items-center md:gap-4 md:py-3"
              >
                <span className="min-w-0">
                  <span className="block font-sans text-base leading-snug font-semibold tracking-tight text-ink md:truncate md:text-sm">
                    {job.title}
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-2">
                    {featured && (
                      <span className="hidden shrink-0 md:inline-flex">
                        <Badge tone="featured">Featured</Badge>
                      </span>
                    )}
                    <span className="font-sans text-sm text-secondary md:truncate md:text-xs">
                      {job.company.name}
                    </span>
                  </span>
                </span>

                <span className="mt-2 block md:hidden">
                  {featured && (
                    <span className="mb-1.5 block">
                      <Badge tone="featured">Featured</Badge>
                    </span>
                  )}
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 font-sans text-sm text-secondary">
                      {job.location}
                      {showField && <span> · {field}</span>}
                    </span>
                    {!salary && (
                      <span
                        className="shrink-0 font-mono text-xs tabular-nums text-secondary"
                        suppressHydrationWarning
                      >
                        {getPostedLabel(job.scraped_at)}
                      </span>
                    )}
                  </span>
                  {salary && (
                    <span className="mt-1 flex items-baseline justify-between gap-3 font-mono text-xs">
                      <span className="whitespace-nowrap tabular-nums text-ink">
                        {salary}
                      </span>
                      <span
                        className="shrink-0 tabular-nums text-secondary"
                        suppressHydrationWarning
                      >
                        {getPostedLabel(job.scraped_at)}
                      </span>
                    </span>
                  )}
                </span>

                <span className="hidden min-w-0 truncate font-sans text-sm text-secondary md:block">
                  {job.location}
                </span>
                <span className="hidden font-mono text-xs text-secondary md:block">
                  {showField ? field : <span className="text-muted">—</span>}
                </span>
                <span className="hidden font-mono text-xs tabular-nums text-ink md:block">
                  {salary ?? <span className="text-muted">—</span>}
                </span>
                <span
                  className="hidden text-right font-mono text-xs tabular-nums text-secondary md:block"
                  suppressHydrationWarning
                >
                  {getPostedLabel(job.scraped_at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
