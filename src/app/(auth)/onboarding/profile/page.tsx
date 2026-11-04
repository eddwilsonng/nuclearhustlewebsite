import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/account";
import { isSubscribedToDigest } from "@/lib/email/subscription";
import { safeInternalPath, withRedirect } from "@/lib/redirects";
import { SeekerSetupForm } from "@/components/auth/SeekerSetupForm";

export const metadata = {
  title: "Set up job matching - Nuclear Hustle",
};

export default async function SeekerOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const next = safeInternalPath((await searchParams).redirect) ?? "/dashboard";
  const account = await getAccountContext();
  if (!account) redirect(withRedirect("/login", "/onboarding/profile"));
  if (!account.profile) redirect(withRedirect("/onboarding", next));
  if (account.role !== "job_seeker") redirect("/dashboard");

  const alreadySubscribed = account.user.email ? await isSubscribedToDigest(account.user.email) : false;
  const returningToJob = next.startsWith("/job/");

  return (
    <div className="w-full max-w-lg">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        Account created
      </p>
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        Set up job matching.
      </h1>
      <p className="mb-8 font-sans text-sm leading-relaxed text-secondary">
        Your field and state decide which new roles your dashboard shows first. A stored
        resume lets you apply without uploading it each time. All of it is optional
        {returningToJob ? ", and we'll take you back to the job next." : "."}
      </p>

      <SeekerSetupForm seeker={account.seeker} redirect={next} alreadySubscribed={alreadySubscribed} />
    </div>
  );
}
