import { JobPostingForm } from "@/components/dashboard/JobPostingForm";
import { DashboardPageHeader } from "@/components/dashboard/DashboardChrome";

export const metadata = {
  title: "Post a Job - Nuclear Hustle",
};

export default function NewJobPage() {
  return (
    <div className="max-w-3xl">
      <DashboardPageHeader
        eyebrow="Employer"
        title="Post a job"
        description="Live on the board as soon as you publish. Feature it if you want it pinned."
      />
      <JobPostingForm mode="create" />
    </div>
  );
}
