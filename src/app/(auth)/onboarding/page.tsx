import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/account";
import { safeInternalPath, withRedirect } from "@/lib/redirects";
import { RoleChoiceForm } from "@/components/auth/RoleChoiceForm";

export const metadata = {
  title: "Complete Sign Up - Nuclear Hustle",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const next = safeInternalPath((await searchParams).redirect) ?? undefined;
  const account = await getAccountContext();
  if (!account) redirect(withRedirect("/login", "/onboarding"));

  // Already has a role: carry on to whatever is still missing.
  if (account.profile) {
    if (account.role === "employer" && !account.employer) {
      redirect(withRedirect("/onboarding/company", next));
    }
    redirect(next ?? "/dashboard");
  }

  return (
    <div className="w-full max-w-lg">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-secondary">
        Signed in as {account.user.email}
      </p>
      <h1 className="mb-2 font-sans text-3xl font-bold leading-tight text-ink md:text-4xl">
        One more step.
      </h1>
      <p className="mb-8 font-sans text-sm leading-relaxed text-secondary">
        Pick the account type that fits. It decides what your dashboard shows.
      </p>

      <RoleChoiceForm redirect={next} />
    </div>
  );
}
