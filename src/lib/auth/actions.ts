"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const jobSeekerSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  location: z.string().optional(),
});

const employerSignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  redirect(redirectTo || "/dashboard");
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

// Update job seeker profile
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

  const fullName = formData.get("fullName") as string;
  const location = formData.get("location") as string;

  // Update profile name
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  // Update job seeker location
  const { error: jobSeekerError } = await supabase
    .from("job_seeker_profiles")
    .update({ location: location || null })
    .eq("user_id", user.id);

  if (jobSeekerError) {
    return { error: jobSeekerError.message };
  }

  return { success: true };
}

// Update employer profile
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

  const fullName = formData.get("fullName") as string;
  const companyName = formData.get("companyName") as string;
  const companyWebsite = formData.get("companyWebsite") as string;
  const companyDescription = formData.get("companyDescription") as string;

  // Update profile name
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  // Update employer profile
  const { error: employerError } = await supabase
    .from("employer_profiles")
    .update({
      company_name: companyName,
      company_website: companyWebsite || null,
      company_description: companyDescription || null,
    })
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

  const { error: insertError } = await supabase.from("employer_jobs").insert({
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
  });

  if (insertError) {
    return { error: insertError.message };
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

  const { error } = await supabase
    .from("employer_jobs")
    .update({ is_active: isActive })
    .eq("id", jobId);

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

  const { error } = await supabase
    .from("employer_jobs")
    .delete()
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
