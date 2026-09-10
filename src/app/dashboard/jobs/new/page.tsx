import { JobPostingForm } from "@/components/dashboard/JobPostingForm";
import { DashboardBody, DashboardPageHeader } from "@/components/dashboard/DashboardChrome";

export const metadata = {
  title: "New job - Nuclear Hustle",
};

export default function NewJobPage() {
  return (
    <>
      <DashboardPageHeader
        title="New job"
        description="Live on the board as soon as you publish."
      />
      <DashboardBody width="form">
        <JobPostingForm mode="create" />
      </DashboardBody>
    </>
  );
}
