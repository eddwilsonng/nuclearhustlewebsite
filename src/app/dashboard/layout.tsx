import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/account";
import { provisionAccount } from "@/lib/auth/provision";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ToastProvider } from "@/components/ui/Toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const account = await getAccountContext();
  if (!account) redirect("/login?redirect=/dashboard");

  if (!account.profile) {
    // A signup that stopped halfway: rebuild the rows from signup metadata.
    const result = await provisionAccount(account.user);
    redirect(result.role && !result.error ? "/dashboard" : "/onboarding");
  }

  if (account.role === "employer" && !account.employer && !account.isAdmin) {
    redirect("/onboarding/company?redirect=/dashboard");
  }

  let newApplicants = 0;
  if (account.role === "employer" && account.employer) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("employer_id", account.employer.id)
      .eq("status", "new");
    newApplicants = count ?? 0;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row md:overflow-hidden">
        <DashboardSidebar
          name={account.profile.full_name}
          role={account.role ?? account.profile.role}
          workspaceName={account.employer?.company_name}
          isAdmin={account.isAdmin}
          newApplicants={newApplicants}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 min-w-0 flex-1 bg-canvas outline-none md:overflow-y-auto"
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
