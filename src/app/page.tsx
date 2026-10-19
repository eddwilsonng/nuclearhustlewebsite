import Link from "next/link";
import Image from "next/image";
import {
  getAllJobsForList,
  getAllCompanies,
  getAllActiveStates,
  getAllActiveCategories,
} from "@/lib/data/employer";
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
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-6 py-2 font-mono text-xs text-secondary">
          <span className="font-semibold text-ink">FLEET&nbsp;STATUS</span>
          <span>
            <span className="tabular-nums text-ink">{jobCount}</span> open roles
          </span>
          <span>
            <span className="tabular-nums text-ink">{companies.length}</span>{" "}
            operators
          </span>
          <span>
            <span className="tabular-nums text-ink">{activeStates.length}</span>{" "}
            states
          </span>
          <span className="ml-auto">
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
              Open roles by state, ranked. The fleet is concentrated — so is the
              hiring.
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
              href="/status"
              className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-secondary hover:text-ink"
            >
              View the full fleet map →
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
              Get ahead of the posting
            </p>
            <h2 className="mt-3 font-sans text-3xl font-bold tracking-tight text-ink text-balance">
              New roles hit the fleet every day. See them Monday morning.
            </h2>
            <p className="mt-4 max-w-md font-sans text-base leading-relaxed text-secondary">
              One email a week, grouped by region. No filler — just what&rsquo;s
              new across {companies.length} operators.
            </p>
            <div className="mt-8">
              <JobAlertForm />
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
  { id: "constellation", name: "Constellation", src: "/company-logos/constellation.png" },
  { id: "duke", name: "Duke Energy", src: "/company-logos/duke.png" },
  { id: "dominion", name: "Dominion", src: "/company-logos/dominion.png" },
  { id: "nextera", name: "NextEra", src: "/company-logos/nextera.png" },
  { id: "tva", name: "TVA", src: "/company-logos/tva.png" },
] as const;

function OperatorWall() {
  const operators = WALL_OPERATORS.map((op) => ({
    ...op,
    jobCount: getJobsByCompany(op.id).length,
  }));

  return (
    <section className="border-b border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-mono text-xs uppercase tracking-widest text-secondary">
            Hiring from America&rsquo;s largest operators
          </h2>
          <Link
            href="/companies"
            className="font-mono text-xs uppercase tracking-widest text-ink hover:underline underline-offset-4"
          >
            All operators →
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-5">
          {operators.map((op) => (
            <li key={op.id}>
              <Link
                href={`/companies/${op.id}`}
                className="group flex h-full min-h-[6rem] flex-col items-center justify-center gap-2 bg-surface px-4 py-5 transition-colors duration-150 hover:bg-canvas"
              >
                <Image
                  src={op.src}
                  alt=""
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain opacity-85 grayscale transition duration-150 group-hover:opacity-100 group-hover:grayscale-0"
                />
                <span className="font-sans text-sm font-semibold text-ink">
                  {op.name}
                </span>
                {op.jobCount > 0 && (
                  <span className="font-mono text-xs text-secondary">
                    <span className="tabular-nums text-ink">{op.jobCount}</span>{" "}
                    open
                  </span>
                )}
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
      <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
        <h2 className="font-mono text-xs uppercase tracking-widest text-secondary">
          Latest on the board
        </h2>
        <Link
          href="/jobs"
          className="font-mono text-xs uppercase tracking-widest text-ink hover:underline underline-offset-4"
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
          const featured = isLiveFeatured(job);
          return (
            <li key={job.id}>
              <Link
                href={`/job/${job.slug}`}
                className={`grid grid-cols-1 gap-x-4 gap-y-1 border-b border-rule px-4 py-3 transition-colors last:border-b-0 hover:bg-surface md:grid-cols-[minmax(0,1fr)_10rem_7rem_8rem_5rem] md:items-center ${
                  featured ? "border-l-2 border-l-signal" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-sans text-sm font-semibold tracking-tight text-ink">
                    {job.title}
                  </span>
                  <span className="mt-1 flex min-w-0 items-center gap-2">
                    {featured && <Badge tone="featured">Featured</Badge>}
                    <span className="truncate font-sans text-xs text-secondary">
                      {job.company.name}
                    </span>
                  </span>
                </span>
                <span className="truncate font-sans text-sm text-secondary">
                  {job.location}
                </span>
                <span className="font-mono text-xs text-secondary">
                  {field}
                </span>
                <span className="font-mono text-xs tabular-nums text-ink">
                  {salary ?? <span className="text-muted">—</span>}
                </span>
                <span
                  className="font-mono text-xs tabular-nums text-secondary md:text-right"
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
