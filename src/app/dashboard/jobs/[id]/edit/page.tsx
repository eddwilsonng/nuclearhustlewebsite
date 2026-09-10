import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JobPostingForm } from "@/components/dashboard/JobPostingForm";
import { LinkButton } from "@/components/ui/LinkButton";
import { DashboardBody, DashboardPageHeader } from "@/components/dashboard/DashboardChrome";
import type { EmployerJob } from "@/lib/types";

export const metadata = {
  title: "Edit job - Nuclear Hustle",
};

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!employerProfile) {
    notFound();
  }

  const { data: job } = await supabase
    .from("employer_jobs")
    .select("*")
    .eq("id", id)
    .eq("employer_id", employerProfile.id)
    .single();

  if (!job) {
    notFound();
  }

  const typedJob = job as EmployerJob;

  return (
    <>
      <DashboardPageHeader
        title={typedJob.title}
        description="Edit posting"
        action={
          <LinkButton href="/dashboard/jobs" variant="quiet" size="compact">
            Back
          </LinkButton>
        }
      />
      <DashboardBody width="form">
        <JobPostingForm job={typedJob} mode="edit" />
      </DashboardBody>
    </>
  );
}
