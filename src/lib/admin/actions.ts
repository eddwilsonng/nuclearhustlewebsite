"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { extractState } from "@/lib/states";
import { parseJobPostingForm } from "@/lib/jobs/postingInput";
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

  const parsed = parseJobPostingForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error: updateError } = await admin
    .from("employer_jobs")
    .update(parsed.data)
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

    const state = extractState(validated.data.location);

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
