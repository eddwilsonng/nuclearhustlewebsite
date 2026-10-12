import { createHmac } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Every record the flows create is tagged with this marker so cleanup can find
// leftovers from crashed runs. resend.dev addresses are Resend's sandbox
// inboxes: sends succeed without reaching a real person or hurting reputation.
export const TEST_MARKER = "nh-e2e";
export const TEST_PASSWORD = "E2e-test-password-1";

export function testRunId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function testEmail(runId: string, role: string): string {
  return `delivered+${TEST_MARKER}-${runId}-${role}@resend.dev`;
}

export function isTestEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().startsWith(`delivered+${TEST_MARKER}-`));
}

export function testCv(name = "e2e-cv.pdf") {
  const pdf = [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj",
    "trailer << /Root 1 0 R >>",
    "%%EOF",
  ].join("\n");
  return { name, mimeType: "application/pdf", buffer: Buffer.from(pdf) };
}

export function unsubscribeToken(email: string): string {
  const secret = process.env.CRON_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("CRON_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set");
  return createHmac("sha256", secret).update(email.toLowerCase()).digest("hex").slice(0, 32);
}

export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// /api/apply allows 5 requests per IP per 10 minutes. Locally every request
// comes from the same loopback address, so flows reset it between tests.
const LOCAL_RATE_LIMIT_KEYS = ["apply:unknown", "apply:::1", "apply:127.0.0.1", "apply:::ffff:127.0.0.1"];

export async function resetLocalApplyRateLimit() {
  await adminClient().from("rate_limits").delete().in("key", LOCAL_RATE_LIMIT_KEYS);
}

async function removeStorageFolder(admin: SupabaseClient, folder: string) {
  const { data: files } = await admin.storage.from("resumes").list(folder, { limit: 1000 });
  if (!files?.length) return;
  await admin.storage.from("resumes").remove(files.map((file) => `${folder}/${file.name}`));
}

// Deletes every test user plus the storage files and alert rows they left
// behind. Profiles, employer jobs, applications and saved jobs cascade from
// auth.users, but storage objects and alert subscribers don't.
export async function cleanupTestData(): Promise<{ users: number; subscribers: number }> {
  const admin = adminClient();
  const testUsers: { id: string }[] = [];

  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    testUsers.push(...data.users.filter((user) => isTestEmail(user.email)));
    if (data.users.length < 1000) break;
  }

  for (const user of testUsers) {
    const { data: employer } = await admin
      .from("employer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (employer) {
      const { data: jobs } = await admin
        .from("employer_jobs")
        .select("id")
        .eq("employer_id", employer.id);
      for (const job of jobs ?? []) {
        await removeStorageFolder(admin, `applications/${job.id}`);
      }
    }

    await removeStorageFolder(admin, user.id);
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }

  const { data: subscribers } = await admin
    .from("job_alert_subscribers")
    .delete()
    .like("email", `delivered+${TEST_MARKER}-%`)
    .select("email");

  return { users: testUsers.length, subscribers: subscribers?.length ?? 0 };
}
