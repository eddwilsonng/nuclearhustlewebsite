import type { Metadata } from "next";
import Link from "next/link";
import { JobAlertForm } from "@/components/JobAlertForm";

export const metadata: Metadata = {
  title: "Nuclear Job Alerts by Email | Nuclear Hustle",
  description:
    "Get a Monday email with the nuclear power plant jobs that went live that week, grouped by region. Free, no account needed.",
  alternates: { canonical: "/alerts" },
};

export default function AlertsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
      <div className="max-w-xl">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">Job alerts</p>
        <h1 className="font-sans text-3xl font-bold leading-tight text-ink md:text-5xl">
          New nuclear jobs, every Monday.
        </h1>
        <p className="mt-4 font-sans text-base leading-relaxed text-secondary">
          One email a week with the roles that went live in the last seven days, grouped by
          region. No account needed, and every email has a one-click unsubscribe.
        </p>

        <div className="mt-8">
          <JobAlertForm heading="Your email" description="" />
        </div>

        <p className="mt-10 border-t border-rule pt-6 font-sans text-sm leading-relaxed text-secondary">
          Want to save roles and keep a record of your applications as well?{" "}
          <Link href="/signup/job-seeker" className="font-medium text-ink underline underline-offset-2">
            Create a free account
          </Link>
          . You can turn the Monday email on during setup.
        </p>
      </div>
    </div>
  );
}
