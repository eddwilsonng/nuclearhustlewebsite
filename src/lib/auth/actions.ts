"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createFeaturedCheckoutSession } from "@/lib/stripe/featured";
import { expiryFromNow } from "@/lib/jobs/expiry";
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from "@/lib/admin";
import { parseJobPostingForm } from "@/lib/jobs/postingInput";
import { getAllCategories, type JobCategory } from "@/lib/categorize";
import { safeInternalPath, withRedirect } from "@/lib/redirects";
import { friendlyError } from "@/lib/auth/errors";
import { generateSlug, provisionAccount, uniqueCompanySlug } from "@/lib/auth/provision";
import {
  checkVerificationCode,
  isEmailVerified,
  sendVerificationCode,
} from "@/lib/auth/verification";
import { subscribeToDigest, unsubscribeFromDigest } from "@/lib/email/subscription";
import { fieldErrorsFrom, formValues } from "@/lib/forms";
import type { UserRole } from "@/lib/types";

export type ActionState = {
  error?: string;
  success?: boolean;
  /** Plain confirmation to show or toast, e.g. "New code sent". */
  message?: string;
  /** First error per field, keyed by the field's form name. */
  fieldErrors?: Record<string, string>;
  /** Submitted text values, so a failed submit doesn't clear the form. */
  values?: Record<string, string>;
};

const EMPLOYER_DEFAULT_NEXT = "/dashboard/jobs/new";
const SEEKER_DEFAULT_NEXT = "/dashboard";

const email = z.string().trim().email("Enter a valid email address");
const password = z.string().min(8, "Use at least 8 characters");
const fullName = z.string().trim().min(2, "Enter your name").max(200);
const companyName = z.string().trim().min(2, "Enter your company name").max(200);
const companyWebsite = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https?:\/\/\S+\.\S+/i.test(value), {
    message: "Enter the full address, starting with https://",
  });

function acceptedTerms(formData: FormData): boolean {
  return formData.get("acceptedTerms") === "on";
}

async function currentUser(): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidateDashboard() {
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------------------
// Sign in, sign out, password
// ---------------------------------------------------------------------------

const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });

export async function signIn(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const values = formValues(formData, ["email"]);
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendlyError(error.message), values };

  // Heal an account whose signup stopped halfway (profile rows missing).
  if (data.user) await provisionAccount(data.user);

  redirect(safeInternalPath(formData.get("redirect")) ?? "/dashboard");
}

export async function requestPasswordReset(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0].message }, values: formValues(formData, ["email"]) };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("Password reset request failed:", error);
  }

  // Always succeed so we don't leak whether the email exists.
  return { success: true };
}

export async function updatePassword(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) return { fieldErrors: { password: "Use at least 8 characters" } };
  if (next !== confirm) return { fieldErrors: { confirmPassword: "The two passwords don't match" } };

  const { supabase, user } = await currentUser();
  if (!user) return { error: "This reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: friendlyError(error.message) };

  redirect("/dashboard");
}

/** Settings: change (or, for Google accounts, add) a password. */
export async function changePassword(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user?.email) return { error: "Log in again to change your password." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const hasPassword = (user.identities ?? []).some((identity) => identity.provider === "email");

  if (hasPassword && !current) return { fieldErrors: { currentPassword: "Enter your current password" } };
  if (next.length < 8) return { fieldErrors: { password: "Use at least 8 characters" } };
  if (next !== confirm) return { fieldErrors: { confirmPassword: "The two passwords don't match" } };

  if (hasPassword) {
    const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (error) return { fieldErrors: { currentPassword: "That isn't your current password" } };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: friendlyError(error.message) };

  return { success: true, message: "Password updated." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------

const jobSeekerSignupSchema = z.object({ fullName, email, password });
const employerSignupSchema = z.object({ fullName, email, password, companyName });

export async function signUpJobSeeker(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const values = formValues(formData, ["fullName", "email"]);
  if (!acceptedTerms(formData)) {
    return { fieldErrors: { acceptedTerms: "Accept the Terms of Service to create an account" }, values };
  }

  const parsed = jobSeekerSignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: "job_seeker",
        full_name: parsed.data.fullName,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });
  if (error) return { error: friendlyError(error.message), values };
  if (!data.user) return { error: friendlyError(null), values };

  // A failure here is recoverable: the dashboard re-runs provisioning.
  await provisionAccount(data.user, { role: "job_seeker", fullName: parsed.data.fullName, acceptedTerms: true });

  redirect(withRedirect("/onboarding/profile", safeInternalPath(formData.get("redirect"))));
}

export async function signUpEmployer(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const values = formValues(formData, ["fullName", "email", "companyName"]);
  if (!acceptedTerms(formData)) {
    return { fieldErrors: { acceptedTerms: "Accept the Terms of Service to create an account" }, values };
  }

  const parsed = employerSignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        role: "employer",
        full_name: parsed.data.fullName,
        company_name: parsed.data.companyName,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });
  if (error) return { error: friendlyError(error.message), values };
  if (!data.user) return { error: friendlyError(null), values };

  await provisionAccount(data.user, {
    role: "employer",
    fullName: parsed.data.fullName,
    companyName: parsed.data.companyName,
    acceptedTerms: true,
  });
  // If the send fails, the verify page explains and offers a resend.
  await sendVerificationCode(data.user.id, parsed.data.email);

  redirect(
    withRedirect("/onboarding/verify", safeInternalPath(formData.get("redirect")) ?? EMPLOYER_DEFAULT_NEXT),
  );
}

export async function signInWithGoogle(formData: FormData) {
  const role = formData.get("role") as string | null;
  const next = safeInternalPath(formData.get("redirect"));
  if (role && !acceptedTerms(formData)) {
    const path = role === "employer" ? "/signup/employer" : "/signup/job-seeker";
    redirect(`${path}?error=${encodeURIComponent("Accept the Terms of Service to create an account")}`);
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const callbackUrl = new URL(`${siteUrl}/api/auth/callback`);
  if (role === "employer" || role === "job_seeker") callbackUrl.searchParams.set("role", role);
  if (next) callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    redirect("/login?error=Could not sign in with Google");
  }

  redirect(data.url);
}

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

/** /onboarding: a Google account with no role yet picks one and accepts the terms. */
export async function chooseAccountRole(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user } = await currentUser();
  if (!user) redirect("/login");

  const role = formData.get("role");
  if (role !== "employer" && role !== "job_seeker") {
    return { fieldErrors: { role: "Choose how you'll use Nuclear Hustle" } };
  }
  if (!acceptedTerms(formData)) {
    return { fieldErrors: { acceptedTerms: "Accept the Terms of Service to continue" } };
  }

  const result = await provisionAccount(user, { role: role as UserRole, acceptedTerms: true });
  if (result.error) return { error: friendlyError(result.error) };

  const next = safeInternalPath(formData.get("redirect"));
  if (role === "employer") {
    redirect(withRedirect("/onboarding/company", next ?? EMPLOYER_DEFAULT_NEXT));
  }
  redirect(withRedirect("/onboarding/profile", next));
}

export async function verifyEmployerEmail(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user } = await currentUser();
  if (!user) redirect("/login");

  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  const result = await checkVerificationCode(user.id, code);
  if (!result.ok) return { fieldErrors: { code: result.error } };

  revalidateDashboard();
  if (formData.get("inline") === "1") {
    return { success: true, message: "Email confirmed. You can post now." };
  }
  redirect(withRedirect("/onboarding/company", safeInternalPath(formData.get("redirect")) ?? EMPLOYER_DEFAULT_NEXT));
}

export async function resendVerificationCode(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  void formData;
  const { user } = await currentUser();
  if (!user?.email) redirect("/login");

  const result = await sendVerificationCode(user.id, user.email);
  if (!result.ok) return { error: result.error };
  return { success: true, message: `New code sent to ${user.email}.` };
}

/** Fix a typo'd work email before it is verified. The new address still has to be confirmed. */
export async function changeVerificationEmail(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { user } = await currentUser();
  if (!user) redirect("/login");

  const values = formValues(formData, ["newEmail"]);
  const parsed = email.safeParse(formData.get("newEmail"));
  if (!parsed.success) return { fieldErrors: { newEmail: parsed.error.issues[0].message }, values };
  const nextEmail = parsed.data.toLowerCase();

  if (await isEmailVerified(user.id)) {
    return { error: "Your email is already confirmed. Contact us to change it." };
  }
  if (nextEmail === user.email?.toLowerCase()) {
    return { fieldErrors: { newEmail: "That's the address we already have" }, values };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { email: nextEmail, email_confirm: true });
  if (error) {
    return {
      fieldErrors: {
        newEmail: /already|registered|exists/i.test(error.message)
          ? "That email already has an account"
          : friendlyError(error.message),
      },
      values,
    };
  }
  await admin.from("profiles").update({ email: nextEmail }).eq("id", user.id);

  const sent = await sendVerificationCode(user.id, nextEmail);
  if (!sent.ok) return { error: sent.error };
  return { success: true, message: `Code sent to ${nextEmail}.` };
}

// ---------------------------------------------------------------------------
// Company and seeker profiles
// ---------------------------------------------------------------------------

const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Create or update the signed-in employer's company. Creating covers the
 * account whose company row never got written, which used to loop forever
 * between "Finish company setup" and a profile form that saved nothing.
 */
async function saveCompany(
  supabase: SupabaseClient,
  user: User,
  formData: FormData
): Promise<ActionState> {
  const values = formValues(formData, ["companyName", "companyWebsite", "companyDescription", "fullName"]);
  const parsed = z
    .object({
      companyName,
      companyWebsite,
      companyDescription: z.string().trim().max(2000, "Keep it under 2,000 characters"),
    })
    .safeParse({
      companyName: formData.get("companyName") ?? "",
      companyWebsite: formData.get("companyWebsite") ?? "",
      companyDescription: formData.get("companyDescription") ?? "",
    });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const update: Record<string, string | null> = {
    company_name: parsed.data.companyName,
    company_website: parsed.data.companyWebsite || null,
    company_description: parsed.data.companyDescription || null,
  };

  const logoFile = formData.get("companyLogo");
  if (logoFile instanceof File && logoFile.size > 0) {
    const ext = LOGO_TYPES[logoFile.type];
    if (!ext) return { fieldErrors: { companyLogo: "Use a PNG, JPG or WEBP image" }, values };
    if (logoFile.size > 2 * 1024 * 1024) return { fieldErrors: { companyLogo: "Keep the logo under 2 MB" }, values };

    const logoPath = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("company-logos")
      .upload(logoPath, logoFile, { cacheControl: "3600", upsert: true });
    if (uploadError) return { fieldErrors: { companyLogo: friendlyError(uploadError.message) }, values };

    update.company_logo_url = supabase.storage.from("company-logos").getPublicUrl(logoPath).data.publicUrl;
  }

  const { data: existing } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("employer_profiles").update(update).eq("user_id", user.id);
    if (error) return { error: friendlyError(error.message), values };
  } else {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await provisionAccount(user, { role: "employer" });
    const { error } = await admin.from("employer_profiles").insert({
      ...update,
      user_id: user.id,
      company_slug: await uniqueCompanySlug(admin, parsed.data.companyName),
    });
    if (error) return { error: friendlyError(error.message), values };
  }

  return { success: true };
}

/** /onboarding/company: step 2 for employers. */
export async function saveCompanyDetails(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) redirect("/login");

  const result = await saveCompany(supabase, user, formData);
  if (!result.success) return result;

  revalidateDashboard();
  const next = safeInternalPath(formData.get("redirect")) ?? EMPLOYER_DEFAULT_NEXT;
  redirect((await isEmailVerified(user.id)) ? next : withRedirect("/onboarding/verify", next));
}

const employerProfileUpdateSchema = z.object({ fullName });

export async function updateEmployerProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to save your changes." };

  const parsed = employerProfileUpdateSchema.safeParse({ fullName: formData.get("fullName") });
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrorsFrom(parsed.error),
      values: formValues(formData, ["fullName", "companyName", "companyWebsite", "companyDescription"]),
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (profileError) return { error: friendlyError(profileError.message) };

  const result = await saveCompany(supabase, user, formData);
  if (!result.success) return result;

  revalidateDashboard();
  return { success: true, message: "Company profile saved." };
}

const RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

async function storeResume(
  supabase: SupabaseClient,
  user: User,
  file: File
): Promise<{ error?: string }> {
  if (!RESUME_TYPES.includes(file.type)) return { error: "Upload a PDF or Word document" };
  if (file.size > 5 * 1024 * 1024) return { error: "Keep the file under 5 MB" };

  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}/${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(filePath, file, { cacheControl: "3600", upsert: false });
  if (uploadError) return { error: friendlyError(uploadError.message) };

  // Store the private storage path — never a public URL. Viewed via /dashboard/resume.
  const { error: updateError } = await supabase
    .from("job_seeker_profiles")
    .update({ resume_url: filePath, resume_filename: file.name })
    .eq("user_id", user.id);
  if (updateError) return { error: friendlyError(updateError.message) };
  return {};
}

const CATEGORY_VALUES = getAllCategories() as string[];

const seekerOnboardingSchema = z.object({
  primaryCategory: z
    .string()
    .refine((value) => value === "" || CATEGORY_VALUES.includes(value), { message: "Pick a field from the list" }),
  state: z.string().max(2),
  location: z.string().trim().max(200),
});

/** /onboarding/profile: the one optional setup screen for job seekers. */
export async function saveSeekerOnboarding(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) redirect("/login");

  const values = formValues(formData, ["primaryCategory", "state", "location"]);
  const parsed = seekerOnboardingSchema.safeParse({
    primaryCategory: formData.get("primaryCategory") ?? "",
    state: formData.get("state") ?? "",
    location: formData.get("location") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  await provisionAccount(user, { role: "job_seeker" });

  const { error } = await supabase
    .from("job_seeker_profiles")
    .update({
      primary_category: (parsed.data.primaryCategory || null) as JobCategory | null,
      state: parsed.data.state || null,
      location: parsed.data.location || null,
    })
    .eq("user_id", user.id);
  if (error) return { error: friendlyError(error.message), values };

  const resume = formData.get("resume");
  if (resume instanceof File && resume.size > 0) {
    const stored = await storeResume(supabase, user, resume);
    if (stored.error) return { fieldErrors: { resume: stored.error }, values };
  }

  if (formData.get("weeklyDigest") === "on" && user.email) {
    await subscribeToDigest(user.email);
  }

  revalidateDashboard();
  redirect(safeInternalPath(formData.get("redirect")) ?? SEEKER_DEFAULT_NEXT);
}

const jobSeekerProfileSchema = z.object({
  fullName,
  location: z.string().trim().max(200),
  state: z.string().max(2),
  phone: z.string().trim().max(20, "Keep the number under 20 characters"),
  primaryCategory: z
    .string()
    .refine((value) => value === "" || CATEGORY_VALUES.includes(value), { message: "Pick a field from the list" }),
});

export async function updateJobSeekerProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to save your changes." };

  const values = formValues(formData, ["fullName", "location", "state", "phone", "primaryCategory"]);
  const parsed = jobSeekerProfileSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    location: formData.get("location") ?? "",
    state: formData.get("state") ?? "",
    phone: formData.get("phone") ?? "",
    primaryCategory: formData.get("primaryCategory") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error), values };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (profileError) return { error: friendlyError(profileError.message), values };

  await provisionAccount(user, { role: "job_seeker" });
  const { error } = await supabase
    .from("job_seeker_profiles")
    .update({
      location: parsed.data.location || null,
      state: parsed.data.state || null,
      phone: parsed.data.phone || null,
      primary_category: parsed.data.primaryCategory || null,
      is_actively_looking: formData.get("isActivelyLooking") !== "false",
    })
    .eq("user_id", user.id);
  if (error) return { error: friendlyError(error.message), values };

  revalidateDashboard();
  return { success: true, message: "Profile saved." };
}

export async function uploadResume(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to upload a resume." };

  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) return { fieldErrors: { resume: "Choose a file to upload" } };

  const stored = await storeResume(supabase, user, file);
  if (stored.error) return { fieldErrors: { resume: stored.error } };

  revalidateDashboard();
  return { success: true, message: "Resume uploaded." };
}

/** Settings: turn the Monday digest on or off for the account email. */
export async function setWeeklyDigest(subscribed: boolean): Promise<ActionState> {
  const { user } = await currentUser();
  if (!user?.email) return { error: "Log in again to change email settings." };

  const result = subscribed ? await subscribeToDigest(user.email) : await unsubscribeFromDigest(user.email);
  if (!result.ok) return { error: "We couldn't update your email settings. Try again." };

  revalidateDashboard();
  return { success: true, message: subscribed ? "You'll get the Monday digest." : "Monday digest turned off." };
}

// ---------------------------------------------------------------------------
// Admin view switch
// ---------------------------------------------------------------------------

export async function setAdminViewRole(role: AdminViewRole, redirectTo: string = "/dashboard") {
  const { user } = await currentUser();
  if (!isAdmin(user?.email)) return;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_VIEW_COOKIE, role, {
    path: "/dashboard",
    httpOnly: false, // read client-side by the dashboard profile page
    sameSite: "lax",
  });
  redirect(safeInternalPath(redirectTo) ?? "/dashboard");
}

export async function getUser() {
  const { user } = await currentUser();
  return user;
}

// ---------------------------------------------------------------------------
// Job postings
// ---------------------------------------------------------------------------

async function ownEmployerId(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("employer_profiles").select("id").eq("user_id", userId).maybeSingle();
  return data?.id ?? null;
}

export async function createJobPosting(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to post this job." };

  const employerId = await ownEmployerId(supabase, user.id);
  if (!employerId) return { error: "Add your company details before posting a job." };
  if (!(await isEmailVerified(user.id))) {
    return { error: "Confirm your work email before posting. Enter the code we emailed you above." };
  }

  const parsed = parseJobPostingForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error, fieldErrors: parsed.field ? { [parsed.field]: parsed.error } : undefined };
  }

  const jobSlug = `${generateSlug(parsed.data.title)}-${Date.now()}`;

  const { data: insertedJob, error: insertError } = await supabase
    .from("employer_jobs")
    .insert({
      ...parsed.data,
      employer_id: employerId,
      slug: jobSlug,
      expires_at: expiryFromNow(),
    })
    .select("id")
    .single();

  if (insertError || !insertedJob) return { error: friendlyError(insertError?.message) };

  revalidateDashboard();
  const postedPath = `/dashboard/jobs/${insertedJob.id}/posted`;

  // If the employer opted to feature the listing during posting, send them
  // straight to Stripe checkout for the newly created job.
  if (formData.get("feature") === "on") {
    if (!acceptedTerms(formData)) redirect(`${postedPath}?featured=terms`);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const result = await createFeaturedCheckoutSession({
      jobId: insertedJob.id,
      userId: user.id,
      customerEmail: user.email,
      successUrl: `${siteUrl}${postedPath}?featured=success`,
      cancelUrl: `${siteUrl}${postedPath}?featured=cancelled`,
    });
    if (result.ok) redirect(result.url);
    // The job is posted either way; the posted page offers checkout again.
    redirect(`${postedPath}?featured=failed`);
  }

  redirect(postedPath);
}

export async function updateJobPosting(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to save this job." };

  const employerId = await ownEmployerId(supabase, user.id);
  if (!employerId) return { error: "This job isn't on your account." };

  const jobId = formData.get("jobId") as string;
  const parsed = parseJobPostingForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error, fieldErrors: parsed.field ? { [parsed.field]: parsed.error } : undefined };
  }

  const { error: updateError } = await supabase
    .from("employer_jobs")
    .update(parsed.data)
    .eq("id", jobId)
    .eq("employer_id", employerId);
  if (updateError) return { error: friendlyError(updateError.message) };

  revalidateDashboard();
  return { success: true, message: "Changes saved. The listing is updated." };
}

export async function toggleJobStatus(jobId: string, isActive: boolean): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to change this job." };

  const employerId = await ownEmployerId(supabase, user.id);
  if (!employerId) return { error: "This job isn't on your account." };

  const { error } = await supabase
    .from("employer_jobs")
    .update({ is_active: isActive })
    .eq("id", jobId)
    .eq("employer_id", employerId); // scope to this employer only
  if (error) return { error: friendlyError(error.message) };

  revalidateDashboard();
  return { success: true, message: isActive ? "Listing is live again." : "Listing paused. It no longer takes applications." };
}

export async function deleteJobPosting(jobId: string): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to delete this job." };

  const employerId = await ownEmployerId(supabase, user.id);
  if (!employerId) return { error: "This job isn't on your account." };

  const { error } = await supabase
    .from("employer_jobs")
    .delete()
    .eq("id", jobId)
    .eq("employer_id", employerId); // scope to this employer only
  if (error) return { error: friendlyError(error.message) };

  revalidateDashboard();
  return { success: true, message: "Listing deleted." };
}

// Renew an expiring/expired job — extends the expiry window and reactivates it
export async function renewJob(jobId: string): Promise<ActionState> {
  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to renew this job." };

  const employerId = await ownEmployerId(supabase, user.id);
  if (!employerId) return { error: "This job isn't on your account." };

  const { error } = await supabase
    .from("employer_jobs")
    .update({ expires_at: expiryFromNow(), is_active: true })
    .eq("id", jobId)
    .eq("employer_id", employerId);
  if (error) return { error: friendlyError(error.message) };

  revalidateDashboard();
  return { success: true, message: "Renewed for another 60 days." };
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

const APPLICATION_STATUSES = ["new", "reviewed", "shortlisted", "rejected"] as const;

// Update an application's pipeline status (RLS scopes this to the owner)
export async function updateApplicationStatus(applicationId: string, status: string): Promise<ActionState> {
  if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
    return { error: "Pick a status from the list" };
  }

  const { supabase, user } = await currentUser();
  if (!user) return { error: "Log in again to update this application." };

  const employerId = await ownEmployerId(supabase, user.id);
  if (!employerId) return { error: "This application isn't on your account." };

  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId)
    .eq("employer_id", employerId);
  if (error) return { error: friendlyError(error.message) };

  revalidateDashboard();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

export async function deleteOwnAccount(): Promise<ActionState> {
  const { supabase, user } = await currentUser();

  if (!user) return { error: "Log in again to delete your account." };
  if (isAdmin(user.email)) {
    return { error: "This admin account can't be deleted from settings." };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  if (user.email) {
    await admin
      .from("job_alert_subscribers")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", user.email.toLowerCase());
  }

  const { data: employer } = await admin
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (employer) {
    const { data: applications } = await admin
      .from("job_applications")
      .select("cv_path")
      .eq("employer_id", employer.id);
    const paths = (applications ?? [])
      .map((row) => row.cv_path)
      .filter((path): path is string => Boolean(path));
    if (paths.length > 0) {
      await admin.storage.from("resumes").remove(paths);
    }
  }

  const { data: resumeFiles } = await admin.storage.from("resumes").list(user.id);
  const ownPaths = (resumeFiles ?? [])
    .filter((file) => file.name)
    .map((file) => `${user.id}/${file.name}`);
  if (ownPaths.length > 0) {
    await admin.storage.from("resumes").remove(ownPaths);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: friendlyError(error.message) };

  await supabase.auth.signOut();
  redirect("/");
}
