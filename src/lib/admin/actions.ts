"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import type { ActionState } from "@/lib/auth/actions";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

const JOBS_JSON_PATH = path.join(process.cwd(), "src/data/jobs.json");

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    throw new Error("Unauthorized");
  }

  return user;
}

function getAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

const jobPostingSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  location: z.string().min(2, "Location is required"),
  category: z.string().min(1, "Category is required"),
  employmentType: z.string().optional(),
  applicationType: z.string().optional(),
  applicationUrl: z.string().optional(),
  applicationEmail: z.string().optional(),
  about: z.string().optional(),
  responsibilities: z.string().optional(),
  qualifications: z.string().optional(),
  desired: z.string().optional(),
  locationDetails: z.string().optional(),
  whatWeOffer: z.string().optional(),
});

// --- Employer job actions (via Supabase service role) ---

export async function adminDeleteJob(jobId: string) {
  await requireAdmin();
  const admin = getAdminClient();
  if (!admin) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local." };
  }

  const { error } = await admin.from("employer_jobs").delete().eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function adminToggleJob(jobId: string, isActive: boolean) {
  await requireAdmin();
  const admin = getAdminClient();
  if (!admin) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local." };
  }

  const { error } = await admin
    .from("employer_jobs")
    .update({ is_active: isActive })
    .eq("id", jobId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function adminUpdateJob(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const admin = getAdminClient();
  if (!admin) {
    return { error: "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local." };
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
    return { error: validatedFields.error.issues[0].message };
  }

  const { applicationType, applicationUrl, applicationEmail } =
    validatedFields.data;

  if (applicationType === "form" && !applicationEmail) {
    return {
      error: "An application email is required when using the form method",
    };
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
    structured.responsibilities &&
      `Responsibilities\n${structured.responsibilities}`,
    structured.qualifications &&
      `Qualifications\n${structured.qualifications}`,
    structured.desired && `Desired\n${structured.desired}`,
    structured.location_details &&
      `Location\n${structured.location_details}`,
    structured.what_we_offer &&
      `What We Offer\n${structured.what_we_offer}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const locationParts = validatedFields.data.location.split(",");
  let state = null;
  if (locationParts.length >= 2) {
    const stateCode = locationParts[locationParts.length - 1].trim();
    state = stateCode.toLowerCase().replace(/\s+/g, "-");
  }

  const { error: updateError } = await admin
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
      application_url:
        applicationType === "link" ? applicationUrl || null : null,
      application_email:
        applicationType === "form" ? applicationEmail || null : null,
    })
    .eq("id", jobId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}

// --- Scraped job actions (via jobs.json file) ---

async function readJobsFile() {
  const raw = await fs.readFile(JOBS_JSON_PATH, "utf-8");
  return JSON.parse(raw) as {
    jobs: Array<{
      id: string;
      company_id: string;
      title: string;
      location: string;
      url: string;
      scraped_at: string;
      slug: string;
      state: string | null;
      category: string;
      description?: string;
    }>;
  };
}

async function writeJobsFile(data: Awaited<ReturnType<typeof readJobsFile>>) {
  await fs.writeFile(JOBS_JSON_PATH, JSON.stringify(data, null, 2) + "\n");
}

export async function adminDeleteScrapedJob(jobId: string) {
  await requireAdmin();

  try {
    const data = await readJobsFile();
    const before = data.jobs.length;
    data.jobs = data.jobs.filter((j) => j.id !== jobId);

    if (data.jobs.length === before) {
      return { error: "Job not found" };
    }

    await writeJobsFile(data);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

const scrapedJobSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  location: z.string().min(2, "Location is required"),
  category: z.string().min(1, "Category is required"),
  url: z.string().optional(),
  description: z.string().optional(),
});

export async function adminUpdateScrapedJob(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const jobId = formData.get("jobId") as string;
  if (!jobId) return { error: "Missing job ID" };

  const rawData = {
    title: formData.get("title") as string,
    location: formData.get("location") as string,
    category: formData.get("category") as string,
    url: (formData.get("url") as string) || "",
    description: (formData.get("description") as string) || "",
  };

  const validated = scrapedJobSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  try {
    const data = await readJobsFile();
    const idx = data.jobs.findIndex((j) => j.id === jobId);
    if (idx === -1) return { error: "Job not found" };

    const locationParts = validated.data.location.split(",");
    let state: string | null = null;
    if (locationParts.length >= 2) {
      const stateCode = locationParts[locationParts.length - 1].trim();
      state = stateCode.toLowerCase().replace(/\s+/g, "-");
    }

    data.jobs[idx] = {
      ...data.jobs[idx],
      title: validated.data.title,
      location: validated.data.location,
      state,
      category: validated.data.category,
      url: validated.data.url || data.jobs[idx].url,
      description: validated.data.description || data.jobs[idx].description,
    };

    await writeJobsFile(data);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update" };
  }
}
