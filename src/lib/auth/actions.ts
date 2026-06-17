"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createFeaturedCheckoutSession } from "@/lib/stripe/featured";
import { expiryFromNow } from "@/lib/jobs/expiry";
import { isAdmin, ADMIN_VIEW_COOKIE, type AdminViewRole } from "@/lib/admin";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const jobSeekerSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().optional(),
  state: z.string().max(2).optional().or(z.literal("")),
});

const employerSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  companyDescription: z.string().optional(),
});

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function signIn(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validatedFields = loginSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  const redirectTo = formData.get("redirect") as string;
  const safePath =
    redirectTo &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.includes("\\")
      ? redirectTo
      : "/dashboard";
  redirect(safePath);
}

export async function signUpJobSeeker(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    fullName: formData.get("fullName") as string,
    location: formData.get("location") as string,
    state: formData.get("state") as string,
  };

  const validatedFields = jobSeekerSignupSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const supabase = await createClient();

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (authError) {
    return {
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      error: "Failed to create user",
    };
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    email: validatedFields.data.email,
    full_name: validatedFields.data.fullName,
    role: "job_seeker",
  });

  if (profileError) {
    return {
      error: profileError.message,
    };
  }

  // Create job seeker profile
  const { error: jobSeekerError } = await supabase
    .from("job_seeker_profiles")
    .insert({
      user_id: authData.user.id,
      location: validatedFields.data.location || null,
      state: validatedFields.data.state || null,
    });

  if (jobSeekerError) {
    return {
      error: jobSeekerError.message,
    };
  }

  redirect("/dashboard");
}

export async function signUpEmployer(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    fullName: formData.get("fullName") as string,
    companyName: formData.get("companyName") as string,
    companyWebsite: formData.get("companyWebsite") as string,
    companyDescription: formData.get("companyDescription") as string,
  };

  const validatedFields = employerSignupSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const supabase = await createClient();

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (authError) {
    return {
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      error: "Failed to create user",
    };
  }

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    email: validatedFields.data.email,
    full_name: validatedFields.data.fullName,
    role: "employer",
  });

  if (profileError) {
    return {
      error: profileError.message,
    };
  }

  // Generate unique company slug
  const baseSlug = generateSlug(validatedFields.data.companyName);
  let companySlug = baseSlug;
  let counter = 1;

  // Check for existing slugs and make unique if needed
  while (true) {
    const { data: existing } = await supabase
      .from("employer_profiles")
      .select("id")
      .eq("company_slug", companySlug)
      .single();

    if (!existing) break;
    companySlug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Create employer profile
  const { error: employerError } = await supabase
    .from("employer_profiles")
    .insert({
      user_id: authData.user.id,
      company_name: validatedFields.data.companyName,
      company_slug: companySlug,
      company_website: validatedFields.data.companyWebsite || null,
      company_description: validatedFields.data.companyDescription || null,
    });

  if (employerError) {
    return {
      error: employerError.message,
    };
  }

  redirect("/dashboard");
}

export async function signInWithGoogle(formData: FormData) {
  const role = formData.get("role") as string | null;
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const callbackUrl = new URL(`${siteUrl}/api/auth/callback`);
  if (role) callbackUrl.searchParams.set("role", role);

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

export async function completeGoogleEmployerProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const companyName = formData.get("companyName") as string;
  const companyWebsite = formData.get("companyWebsite") as string;
  const companyDescription = formData.get("companyDescription") as string;

  if (!companyName || companyName.length < 2) {
    return { error: "Company name must be at least 2 characters" };
  }

  // Ensure the base profile row exists. Google users who signed in via /login
  // (no role) won't have one yet, and employer_profiles.user_id references it.
  const fullName =
    (user.user_metadata?.full_name as string) || user.email!.split("@")[0];
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, email: user.email!, full_name: fullName, role: "employer" },
      { onConflict: "id" }
    );
  if (profileError) return { error: profileError.message };

  const baseSlug = generateSlug(companyName);
  let companySlug = baseSlug;
  let counter = 1;

  while (true) {
    const { data: existing } = await supabase
      .from("employer_profiles")
      .select("id")
      .eq("company_slug", companySlug)
      .single();

    if (!existing) break;
    companySlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const { error: employerError } = await supabase
    .from("employer_profiles")
    .insert({
      user_id: user.id,
      company_name: companyName,
      company_slug: companySlug,
      company_website: companyWebsite || null,
      company_description: companyDescription || null,
    });

  if (employerError) return { error: employerError.message };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function setAdminViewRole(role: AdminViewRole, redirectTo: string = "/dashboard") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdmin(user?.email)) return;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_VIEW_COOKIE, role, {
    path: "/dashboard",
    httpOnly: false, // read client-side by the dashboard profile page
    sameSite: "lax",
  });
  redirect(redirectTo);
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function getJobSeekerProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("job_seeker_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return profile;
}

export async function getEmployerProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return profile;
}

const jobSeekerProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(200),
  location: z.string().max(200).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
});

export async function updateJobSeekerProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const parsed = jobSeekerProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    location: formData.get("location"),
    state: formData.get("state"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const isActivelyLooking = formData.get("isActivelyLooking") === "true";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: jobSeekerError } = await supabase
    .from("job_seeker_profiles")
    .update({
      location: parsed.data.location || null,
      state: parsed.data.state || null,
      phone: parsed.data.phone || null,
      is_actively_looking: isActivelyLooking,
    })
    .eq("user_id", user.id);

  if (jobSeekerError) {
    return { error: jobSeekerError.message };
  }

  return { success: true };
}

const employerProfileUpdateSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(200),
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(200),
  companyWebsite: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  companyDescription: z.string().max(2000).optional().or(z.literal("")),
});

export async function updateEmployerProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const parsed = employerProfileUpdateSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    companyWebsite: formData.get("companyWebsite"),
    companyDescription: formData.get("companyDescription"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  const employerUpdate: {
    company_name: string;
    company_website: string | null;
    company_description: string | null;
    company_logo_url?: string;
  } = {
    company_name: parsed.data.companyName,
    company_website: parsed.data.companyWebsite || null,
    company_description: parsed.data.companyDescription || null,
  };

  // Optional logo upload to the public company-logos bucket
  const logoFile = formData.get("companyLogo") as File | null;
  if (logoFile && logoFile.size > 0) {
    const allowedLogoTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedLogoTypes.includes(logoFile.type)) {
      return { error: "Logo must be a PNG, JPG, WEBP, or SVG image" };
    }
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: "Logo must be less than 2MB" };
    }

    const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png";
    const logoPath = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error: logoUploadError } = await supabase.storage
      .from("company-logos")
      .upload(logoPath, logoFile, { cacheControl: "3600", upsert: true });

    if (logoUploadError) {
      return { error: logoUploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("company-logos").getPublicUrl(logoPath);
    employerUpdate.company_logo_url = publicUrl;
  }

  const { error: employerError } = await supabase
    .from("employer_profiles")
    .update(employerUpdate)
    .eq("user_id", user.id);

  if (employerError) {
    return { error: employerError.message };
  }

  return { success: true };
}

// Upload resume
export async function uploadResume(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("resume") as File;

  if (!file || file.size === 0) {
    return { error: "No file selected" };
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Only PDF and Word documents are allowed" };
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File size must be less than 5MB" };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("resumes").getPublicUrl(fileName);

  // Update job seeker profile with resume URL
  const { error: updateError } = await supabase
    .from("job_seeker_profiles")
    .update({
      resume_url: publicUrl,
      resume_filename: file.name,
    })
    .eq("user_id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}

// Job posting validation schema
const jobPostingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  location: z.string().min(2, "Location is required"),
  category: z.string().min(1, "Category is required"),
  employmentType: z.string().optional(),
  applicationType: z.enum(["link", "form"]).default("link"),
  applicationUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  applicationEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  // Structured description fields (all optional individually)
  about: z.string().optional().or(z.literal("")),
  responsibilities: z.string().optional().or(z.literal("")),
  qualifications: z.string().optional().or(z.literal("")),
  desired: z.string().optional().or(z.literal("")),
  locationDetails: z.string().optional().or(z.literal("")),
  whatWeOffer: z.string().optional().or(z.literal("")),
});

// Create job posting
export async function createJobPosting(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get employer profile
  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!employerProfile) {
    return { error: "Employer profile not found" };
  }

  const rawData = {
    title: formData.get("title") as string,
    location: formData.get("location") as string,
    category: formData.get("category") as string,
    employmentType: formData.get("employmentType") as string,
    applicationType: (formData.get("applicationType") as string) || "link",
    applicationUrl: (formData.get("applicationUrl") as string) || "",
    applicationEmail: (formData.get("applicationEmail") as string) || "",
    about: (formData.get("about") as string) || "",
    responsibilities: (formData.get("responsibilities") as string) || "",
    qualifications: (formData.get("qualifications") as string) || "",
    desired: (formData.get("desired") as string) || "",
    locationDetails: (formData.get("locationDetails") as string) || "",
    whatWeOffer: (formData.get("whatWeOffer") as string) || "",
  };

  const validatedFields = jobPostingSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { applicationType, applicationUrl, applicationEmail } = validatedFields.data;

  if (applicationType === "form" && !applicationEmail) {
    return { error: "An application email is required when using the form method" };
  }

  // Build structured description (only include non-empty fields)
  const structured = {
    about: validatedFields.data.about || undefined,
    responsibilities: validatedFields.data.responsibilities || undefined,
    qualifications: validatedFields.data.qualifications || undefined,
    desired: validatedFields.data.desired || undefined,
    location_details: validatedFields.data.locationDetails || undefined,
    what_we_offer: validatedFields.data.whatWeOffer || undefined,
  };
  const hasContent = Object.values(structured).some(Boolean);
  if (!hasContent) {
    return { error: "Please fill in at least one description field" };
  }

  // Plain text fallback for description column
  const descriptionFallback = [
    structured.about && `About this Role\n${structured.about}`,
    structured.responsibilities && `Responsibilities\n${structured.responsibilities}`,
    structured.qualifications && `Qualifications\n${structured.qualifications}`,
    structured.desired && `Desired\n${structured.desired}`,
    structured.location_details && `Location\n${structured.location_details}`,
    structured.what_we_offer && `What We Offer\n${structured.what_we_offer}`,
  ].filter(Boolean).join("\n\n");

  // Extract state from location
  const locationParts = validatedFields.data.location.split(",");
  let state = null;
  if (locationParts.length >= 2) {
    const stateCode = locationParts[locationParts.length - 1].trim();
    // Convert state code to slug format
    state = stateCode.toLowerCase().replace(/\s+/g, "-");
  }

  // Generate slug
  const baseSlug = generateSlug(validatedFields.data.title);
  const jobSlug = `${baseSlug}-${Date.now()}`;

  const { data: insertedJob, error: insertError } = await supabase
    .from("employer_jobs")
    .insert({
      employer_id: employerProfile.id,
      title: validatedFields.data.title,
      slug: jobSlug,
      location: validatedFields.data.location,
      state,
      category: validatedFields.data.category,
      description: descriptionFallback,
      structured_description: structured,
      employment_type: validatedFields.data.employmentType || "full-time",
      application_type: applicationType,
      application_url: applicationType === "link" ? (applicationUrl || null) : null,
      application_email: applicationType === "form" ? (applicationEmail || null) : null,
      expires_at: expiryFromNow(),
    })
    .select("id")
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  // If the employer opted to feature the listing during posting, send them
  // straight to Stripe checkout for the newly created job.
  if (formData.get("feature") === "on" && insertedJob) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const result = await createFeaturedCheckoutSession({
      jobId: insertedJob.id,
      userId: user.id,
      customerEmail: user.email,
      successUrl: `${siteUrl}/dashboard/jobs?featured=success`,
      cancelUrl: `${siteUrl}/dashboard/jobs`,
    });
    if (result.ok) {
      redirect(result.url);
    }
    // Checkout couldn't be created — the job is still posted; fall through.
  }

  redirect("/dashboard/jobs");
}

// Update job posting
export async function updateJobPosting(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const jobId = formData.get("jobId") as string;

  const rawData = {
    title: formData.get("title") as string,
    location: formData.get("location") as string,
    category: formData.get("category") as string,
    employmentType: formData.get("employmentType") as string,
    applicationType: (formData.get("applicationType") as string) || "link",
    applicationUrl: (formData.get("applicationUrl") as string) || "",
    applicationEmail: (formData.get("applicationEmail") as string) || "",
    about: (formData.get("about") as string) || "",
    responsibilities: (formData.get("responsibilities") as string) || "",
    qualifications: (formData.get("qualifications") as string) || "",
    desired: (formData.get("desired") as string) || "",
    locationDetails: (formData.get("locationDetails") as string) || "",
    whatWeOffer: (formData.get("whatWeOffer") as string) || "",
  };

  const validatedFields = jobPostingSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0].message,
    };
  }

  const { applicationType, applicationUrl, applicationEmail } = validatedFields.data;

  if (applicationType === "form" && !applicationEmail) {
    return { error: "An application email is required when using the form method" };
  }

  const structured = {
    about: validatedFields.data.about || undefined,
    responsibilities: validatedFields.data.responsibilities || undefined,
    qualifications: validatedFields.data.qualifications || undefined,
    desired: validatedFields.data.desired || undefined,
    location_details: validatedFields.data.locationDetails || undefined,
    what_we_offer: validatedFields.data.whatWeOffer || undefined,
  };
  const hasContent = Object.values(structured).some(Boolean);
  if (!hasContent) {
    return { error: "Please fill in at least one description field" };
  }

  const descriptionFallback = [
    structured.about && `About this Role\n${structured.about}`,
    structured.responsibilities && `Responsibilities\n${structured.responsibilities}`,
    structured.qualifications && `Qualifications\n${structured.qualifications}`,
    structured.desired && `Desired\n${structured.desired}`,
    structured.location_details && `Location\n${structured.location_details}`,
    structured.what_we_offer && `What We Offer\n${structured.what_we_offer}`,
  ].filter(Boolean).join("\n\n");

  // Extract state from location
  const locationParts = validatedFields.data.location.split(",");
  let state = null;
  if (locationParts.length >= 2) {
    const stateCode = locationParts[locationParts.length - 1].trim();
    state = stateCode.toLowerCase().replace(/\s+/g, "-");
  }

  const { error: updateError } = await supabase
    .from("employer_jobs")
    .update({
      title: validatedFields.data.title,
      location: validatedFields.data.location,
      state,
      category: validatedFields.data.category,
      description: descriptionFallback,
      structured_description: structured,
      employment_type: validatedFields.data.employmentType || "full-time",
      application_type: applicationType,
      application_url: applicationType === "link" ? (applicationUrl || null) : null,
      application_email: applicationType === "form" ? (applicationEmail || null) : null,
    })
    .eq("id", jobId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}

// Toggle job active status
export async function toggleJobStatus(jobId: string, isActive: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership at the app layer before touching the DB
  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!employerProfile) {
    return { error: "Employer profile not found" };
  }

  const { error } = await supabase
    .from("employer_jobs")
    .update({ is_active: isActive })
    .eq("id", jobId)
    .eq("employer_id", employerProfile.id); // scope to this employer only

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// Delete job posting
export async function deleteJobPosting(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership at the app layer before touching the DB
  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!employerProfile) {
    return { error: "Employer profile not found" };
  }

  const { error } = await supabase
    .from("employer_jobs")
    .delete()
    .eq("id", jobId)
    .eq("employer_id", employerProfile.id); // scope to this employer only

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// Renew an expiring/expired job — extends the expiry window and reactivates it
export async function renewJob(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!employerProfile) {
    return { error: "Employer profile not found" };
  }

  const { error } = await supabase
    .from("employer_jobs")
    .update({ expires_at: expiryFromNow(), is_active: true })
    .eq("id", jobId)
    .eq("employer_id", employerProfile.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

const APPLICATION_STATUSES = ["new", "reviewed", "shortlisted", "rejected"] as const;

// Update an application's pipeline status (RLS scopes this to the owner)
export async function updateApplicationStatus(applicationId: string, status: string) {
  if (!APPLICATION_STATUSES.includes(status as (typeof APPLICATION_STATUSES)[number])) {
    return { error: "Invalid status" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// Mint a fresh signed URL for an applicant's CV. Ownership is verified via the
// user-scoped client (RLS), then the service-role client signs the private file.
export async function getApplicationCvUrl(
  applicationId: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: application, error } = await supabase
    .from("job_applications")
    .select("cv_path")
    .eq("id", applicationId)
    .single();

  if (error || !application) {
    return { error: "Application not found" };
  }

  const cvPath = (application as { cv_path: string | null }).cv_path;
  if (!cvPath) {
    return { error: "No CV on file for this applicant" };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("resumes")
    .createSignedUrl(cvPath, 60 * 5); // 5-minute single-use link

  if (signError || !signed) {
    return { error: "Could not generate CV link" };
  }

  return { url: signed.signedUrl };
}
