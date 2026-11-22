import { getAccountContext } from "@/lib/account";
import { JobSeekerProfileForm } from "@/components/dashboard/JobSeekerProfileForm";
import { EmployerProfileForm } from "@/components/dashboard/EmployerProfileForm";

export async function generateMetadata() {
  const account = await getAccountContext();
  return {
    title: `${account?.role === "employer" ? "Company" : "Profile"} - Nuclear Hustle`,
  };
}

export default async function ProfilePage() {
  const account = await getAccountContext();
  if (!account?.profile) return null;

  if (account.role === "employer") {
    return <EmployerProfileForm profile={account.profile} employerProfile={account.employer} />;
  }
  return <JobSeekerProfileForm profile={account.profile} jobSeekerProfile={account.seeker} />;
}
