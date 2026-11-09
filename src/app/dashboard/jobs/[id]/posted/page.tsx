import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/account";
import { formatShortDate, getListingStatus } from "@/lib/jobs/listingStatus";
import { FEATURED_DURATION_DAYS, featuredPlacementSentence } from "@/lib/jobs/featuredOffer";
import { ExternalLinkButton, LinkButton } from "@/components/ui/LinkButton";
import { DashboardAlert, DashboardBody, DashboardPageHeader } from "@/components/dashboard/DashboardChrome";
import { FeatureOfferButton } from "./FeatureOffer";
import type { EmployerJob } from "@/lib/types";

export const metadata = {
  title: "Listing posted - Nuclear Hustle",
};

const FEATURED_NOTICES: Record<string, { tone: "success" | "error"; text: string }> = {
  success: {
    tone: "success",
    text: "Payment received. The Featured badge appears once Stripe confirms the payment, usually within a minute. Stripe emails your receipt.",
  },
  cancelled: { tone: "error", text: "Checkout cancelled and nothing was charged. The listing is live without featuring." },
  failed: { tone: "error", text: "Checkout couldn't start, so nothing was charged. The listing is live, and you can feature it below." },
  terms: { tone: "error", text: "Featuring needs the terms box ticked. The listing is live, and you can feature it below." },
};

export default async function JobPostedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ featured?: string }>;
}) {
  const [{ id }, { featured }] = await Promise.all([params, searchParams]);
  const account = await getAccountContext();
  if (!account?.profile) return null;
  if (account.role !== "employer" || !account.employer) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("employer_jobs")
    .select("*")
    .eq("id", id)
    .eq("employer_id", account.employer.id)
    .maybeSingle();
  if (!data) notFound();

  const job = data as EmployerJob;
  const status = getListingStatus(job);
  const notice = featured ? FEATURED_NOTICES[featured] : undefined;
  const takesForm = job.application_type === "form";

  return (
    <>
      <DashboardPageHeader
        title={status.key === "live" ? "Your listing is live" : job.title}
        description={status.key === "live" ? job.title : `This listing is ${status.label.toLowerCase()}.`}
        back={{ href: "/dashboard/jobs", label: "Jobs" }}
      />
      <DashboardBody width="form">
        {notice ? (
          <div className="mb-6">
            <DashboardAlert tone={notice.tone}>{notice.text}</DashboardAlert>
          </div>
        ) : null}

        <dl className="grid grid-cols-1 border-y border-rule sm:grid-cols-3">
          <div className="py-4 sm:pr-5">
            <dt className="font-mono text-xs uppercase tracking-widest text-secondary">Location</dt>
            <dd className="mt-1 font-sans text-sm text-ink">{job.location || "Remote"}</dd>
          </div>
          <div className="border-t border-rule py-4 sm:border-t-0 sm:border-l sm:px-5">
            <dt className="font-mono text-xs uppercase tracking-widest text-secondary">Up until</dt>
            <dd className="mt-1 font-sans text-sm text-ink">
              {job.expires_at ? formatShortDate(job.expires_at) : "No expiry"}
            </dd>
          </div>
          <div className="border-t border-rule py-4 sm:border-t-0 sm:border-l sm:pl-5">
            <dt className="font-mono text-xs uppercase tracking-widest text-secondary">Applications</dt>
            <dd className="mt-1 font-sans text-sm text-ink break-words">
              {takesForm ? `Emailed to ${job.application_email}` : "Sent to your careers page"}
            </dd>
          </div>
        </dl>

        <section aria-labelledby="next-heading" className="mt-8">
          <h2 id="next-heading" className="font-sans text-base font-semibold text-ink">
            What happens next
          </h2>
          <ol className="mt-3 space-y-3 font-sans text-sm leading-relaxed text-secondary">
            <li className="flex gap-3">
              <span className="font-mono text-xs text-ink" aria-hidden="true">01</span>
              <span>It&apos;s on the board now, in search, on its state and role pages, and in the next Monday email.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-ink" aria-hidden="true">02</span>
              <span>
                {takesForm
                  ? "Each application arrives by email with the candidate's CV, and appears under Applicants, where you can mark progress."
                  : "Candidates go straight to your careers page. Views are counted here; applications happen on your site."}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-xs text-ink" aria-hidden="true">03</span>
              <span>It stays up for 60 days. We flag it on your overview a week before it expires, and renewing takes one click.</span>
            </li>
          </ol>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <ExternalLinkButton href={`/job/${job.slug}`} target="_blank" variant="secondary">
            View public listing
          </ExternalLinkButton>
          <LinkButton href="/dashboard/jobs/new" variant="secondary">
            Post another job
          </LinkButton>
        </div>

        {status.key === "live" && !status.featuredUntil && featured !== "success" ? (
          <section aria-labelledby="feature-heading" className="mt-10 border border-control bg-raised p-5">
            <h2 id="feature-heading" className="font-sans text-base font-semibold text-ink">
              Want it seen first?
            </h2>
            <p className="mt-2 max-w-prose font-sans text-sm leading-relaxed text-secondary">
              {featuredPlacementSentence()} Full refund if it never goes live as featured.
            </p>
            <div className="mt-4">
              <FeatureOfferButton jobId={job.id} />
            </div>
          </section>
        ) : status.featuredUntil ? (
          <p className="mt-10 font-sans text-sm text-secondary">
            Featured until {formatShortDate(status.featuredUntil)} ({FEATURED_DURATION_DAYS} days in total).
          </p>
        ) : null}
      </DashboardBody>
    </>
  );
}
