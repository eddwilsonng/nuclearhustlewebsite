import { redirect } from "next/navigation";

// Old step name, kept so links in sent emails and bookmarks still work.
export default function EmployerOnboardingPage() {
  redirect("/onboarding/company");
}
