import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from "@/lib/admin";
import type { Profile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  const adminUser = isAdmin(user.email);

  let viewRole = (profile as Profile).role as AdminViewRole;
  if (adminUser) {
    const cookieStore = await cookies();
    const override = cookieStore.get(ADMIN_VIEW_COOKIE)?.value as AdminViewRole | undefined;
    if (override === "employer" || override === "job_seeker") {
      viewRole = override;
    }
  }

  let workspaceName: string | undefined;
  if (viewRole === "employer") {
    const { data: employer } = await supabase
      .from("employer_profiles")
      .select("company_name")
      .eq("user_id", user.id)
      .maybeSingle();
    workspaceName = employer?.company_name ?? undefined;
  }

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row md:overflow-hidden">
      <DashboardSidebar
        profile={profile as Profile}
        workspaceName={workspaceName}
        isAdmin={adminUser}
        viewRole={viewRole}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-canvas">
        {children}
      </div>
    </div>
  );
}
