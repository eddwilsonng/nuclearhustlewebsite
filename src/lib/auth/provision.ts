import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

type AdminClient = ReturnType<typeof createAdminClient>;

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function uniqueCompanySlug(admin: AdminClient, companyName: string): Promise<string> {
  const baseSlug = generateSlug(companyName) || "company";
  let slug = baseSlug;
  for (let counter = 1; ; counter++) {
    const { data: existing } = await admin
      .from("employer_profiles")
      .select("id")
      .eq("company_slug", slug)
      .maybeSingle();
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
  }
}

export function isGoogleUser(user: User): boolean {
  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
  return user.app_metadata?.provider === "google" || providers.includes("google");
}

function displayName(user: User, fallback?: string): string {
  const meta = user.user_metadata ?? {};
  return (
    fallback ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Nuclear Hustle user"
  );
}

function metadataRole(user: User): UserRole | null {
  const role = user.user_metadata?.role;
  return role === "employer" || role === "job_seeker" ? role : null;
}

export type ProvisionInput = {
  role?: UserRole;
  fullName?: string;
  companyName?: string;
  acceptedTerms?: boolean;
};

export type ProvisionResult = {
  role: UserRole | null;
  /** The base profile row was created by this call. */
  created: boolean;
  hasCompany: boolean;
  error?: string;
};

/**
 * Make sure every row an account needs exists. Idempotent: safe to call after
 * signup, in the OAuth callback, and again from the dashboard when a row is
 * missing (a signup that failed halfway heals itself on the next visit).
 *
 * The role comes from the existing profile first, then the caller, then the
 * metadata written at signup. With no role at all it creates nothing, and the
 * person picks one at /onboarding.
 */
export async function provisionAccount(user: User, input: ProvisionInput = {}): Promise<ProvisionResult> {
  const admin = createAdminClient();
  const meta = user.user_metadata ?? {};

  const { data: existing } = await admin
    .from("profiles")
    .select("id, role, terms_accepted_at")
    .eq("id", user.id)
    .maybeSingle();

  const role: UserRole | null = (existing?.role as UserRole | undefined) ?? input.role ?? metadataRole(user);
  if (!role) return { role: null, created: false, hasCompany: false };

  const termsAccepted = input.acceptedTerms || Boolean(meta.terms_accepted_at);
  let created = false;

  if (!existing) {
    const row = {
      id: user.id,
      email: user.email!,
      full_name: displayName(user, input.fullName),
      role,
    };
    let { error } = await admin
      .from("profiles")
      .insert({ ...row, terms_accepted_at: termsAccepted ? new Date().toISOString() : null });
    if (error && /terms_accepted_at/.test(error.message)) {
      // onboarding-migration.sql not run yet; acceptance is still in the auth metadata.
      ({ error } = await admin.from("profiles").insert(row));
    }
    if (error && error.code !== "23505") {
      console.error("[provision] profile insert failed:", error.message);
      return { role, created: false, hasCompany: false, error: error.message };
    }
    created = !error;
  } else if (input.acceptedTerms && !existing.terms_accepted_at) {
    await admin
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  if (role === "job_seeker") {
    const { error } = await admin
      .from("job_seeker_profiles")
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    if (error) {
      console.error("[provision] seeker profile failed:", error.message);
      return { role, created, hasCompany: false, error: error.message };
    }
    return { role, created, hasCompany: false };
  }

  const { data: company } = await admin
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let hasCompany = Boolean(company);
  const companyName = (input.companyName ?? (meta.company_name as string | undefined))?.trim();
  if (!company && companyName && companyName.length >= 2) {
    const { error } = await admin.from("employer_profiles").insert({
      user_id: user.id,
      company_name: companyName,
      company_slug: await uniqueCompanySlug(admin, companyName),
    });
    if (error && error.code !== "23505") {
      console.error("[provision] employer profile failed:", error.message);
      return { role, created, hasCompany: false, error: error.message };
    }
    hasCompany = true;
  }

  // Google has already confirmed the address, so there is nothing to verify.
  if (isGoogleUser(user) && user.email) {
    await admin.from("email_verifications").upsert(
      { user_id: user.id, email: user.email, verified_at: new Date().toISOString() },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  }

  return { role, created, hasCompany };
}
