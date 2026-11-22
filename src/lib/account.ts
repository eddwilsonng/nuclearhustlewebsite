import { cache } from "react";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from "@/lib/admin";
import { isEmailVerified } from "@/lib/auth/verification";
import type { EmployerProfile, JobSeekerProfile, Profile, UserRole } from "@/lib/types";

export type AccountContext = {
  user: User;
  profile: Profile | null;
  /** The role the dashboard renders: the profile role, or the admin's chosen view. */
  role: UserRole | null;
  isAdmin: boolean;
  employer: EmployerProfile | null;
  seeker: JobSeekerProfile | null;
  /** Employers only: whether the work email has been confirmed. */
  emailVerified: boolean;
};

/**
 * Everything a signed-in page needs to know about the account, loaded once per
 * request (layout and page share the result through `cache`).
 */
export const getAccountContext = cache(async (): Promise<AccountContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileRow as Profile | null) ?? null;

  const admin = isAdmin(user.email);
  let role: UserRole | null = profile?.role ?? null;
  if (admin && profile) {
    const override = (await cookies()).get(ADMIN_VIEW_COOKIE)?.value as AdminViewRole | undefined;
    if (override === "employer" || override === "job_seeker") role = override;
  }

  let employer: EmployerProfile | null = null;
  let seeker: JobSeekerProfile | null = null;
  let emailVerified = false;

  if (role === "employer") {
    const { data } = await supabase
      .from("employer_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    employer = (data as EmployerProfile | null) ?? null;
    emailVerified = await isEmailVerified(user.id);
  } else if (role === "job_seeker") {
    const { data } = await supabase
      .from("job_seeker_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    seeker = (data as JobSeekerProfile | null) ?? null;
  }

  return { user, profile, role, isAdmin: admin, employer, seeker, emailVerified };
});
