import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import {
  TEST_PASSWORD,
  adminClient,
  resetLocalApplyRateLimit,
  testCv,
  testEmail,
  testRunId,
} from "../support/testData";

// One employer and one job seeker walk the whole marketplace loop against the
// local dev server. Tests share state and run in order.
test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
  await resetLocalApplyRateLimit();
});

const runId = testRunId();
const employer = {
  name: "Erin Tester",
  email: testEmail(runId, "employer"),
  company: `E2E Test Co ${runId}`,
};
const seeker = {
  name: "Sam Seeker",
  email: testEmail(runId, "seeker"),
};
const guestApplicant = {
  name: "Gus Guest",
  email: testEmail(runId, "guest"),
};
const inboxEmail = testEmail(runId, "inbox");
const jobTitle = `E2E Test Reactor Operator ${runId}`;

let jobSlug = "";
let jobId = "";

const openContexts: BrowserContext[] = [];

test.afterEach(async () => {
  await Promise.all(openContexts.splice(0).map((context) => context.close()));
});

async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  openContexts.push(context);
  return context.newPage();
}

async function logIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

function applicationForm(page: Page) {
  return page.locator("form").filter({
    has: page.getByRole("button", { name: `Apply for ${jobTitle}` }),
  });
}

test("employer can sign up", async ({ page }) => {
  await page.goto("/signup/employer");
  await page.getByLabel("Your name").fill(employer.name);
  await page.getByLabel("Work email").fill(employer.email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Company name").fill(employer.company);
  await page.getByLabel("Website").fill("https://example.com");
  await page.getByRole("button", { name: "Create employer account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(employer.company).first()).toBeVisible();
});

test("signed-in employer is bounced away from auth pages", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, employer.email);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/signup/job-seeker");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("job posting form rejects bad input", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, employer.email);
  await page.goto("/dashboard/jobs/new");

  await page.getByLabel("Job title").fill("Reactor Operator Needed ASAP");
  await expect(page.getByText(/Drop words like "Needed"/)).toBeVisible();

  await page.getByLabel("About this role").fill("Email jobs@example.com for details about this role.");
  await expect(page.getByText(/Remove email addresses/).first()).toBeVisible();
});

test("employer can post a job that takes applications by email", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, employer.email);
  await page.goto("/dashboard/jobs/new");

  await page.getByLabel("Job title").fill(jobTitle);
  await page.getByLabel("Category").selectOption("operations");
  await page.getByLabel("Employment type").selectOption("full-time");
  await page.getByLabel("City").fill("Pottstown");
  await page.getByLabel("State").selectOption("PA");
  await page.getByLabel("Minimum ($)").fill("95000");
  await page.getByLabel("Maximum ($)").fill("130000");
  await page.getByLabel("Per").selectOption("year");
  await page
    .getByLabel("About this role")
    .fill(
      "Automated end-to-end test listing. Operates reactor and balance-of-plant systems on a rotating shift and reports to the shift manager.",
    );
  await page.getByLabel("Responsibilities").fill("Monitor plant parameters\nPerform surveillances");
  await page.getByLabel("Required qualifications").fill("High school diploma\nAbility to obtain unescorted access");
  await page.getByRole("button", { name: /Receive by email/ }).click();
  await page.getByLabel("Application email").fill(inboxEmail);
  await page.getByRole("button", { name: "Post job" }).click();

  await expect(page).toHaveURL(/\/dashboard\/jobs$/);
  await expect(page.getByRole("link", { name: jobTitle })).toBeVisible();

  const { data: job, error } = await adminClient()
    .from("employer_jobs")
    .select("id, slug, is_active, application_type, application_email")
    .eq("title", jobTitle)
    .single();
  expect(error).toBeNull();
  expect(job).toMatchObject({
    is_active: true,
    application_type: "form",
    application_email: inboxEmail,
  });
  jobSlug = job!.slug;
  jobId = job!.id;
});

test("posted job is public with an on-site application form", async ({ page }) => {
  await page.goto(`/job/${jobSlug}`);
  await expect(page.getByRole("heading", { level: 1, name: jobTitle })).toBeVisible();
  await expect(page.getByText(employer.company).first()).toBeVisible();
  await expect(applicationForm(page)).toBeVisible();

  await page.goto(`/jobs?q=${encodeURIComponent(runId)}`);
  await expect(page.getByRole("link", { name: jobTitle }).first()).toBeVisible();
});

test("guest can apply with a CV", async ({ page }) => {
  await page.goto(`/job/${jobSlug}`);
  const form = applicationForm(page);
  await form.getByLabel("Full name").fill(guestApplicant.name);
  await form.getByLabel("Email", { exact: true }).fill(guestApplicant.email);
  await form.getByLabel(/Cover letter/).fill("Automated test application, please ignore.");
  await form.getByLabel(/CV \/ resume/).setInputFiles(testCv());
  await form.getByRole("button", { name: `Apply for ${jobTitle}` }).click();

  await expect(page.getByText(/Application sent\./)).toBeVisible();

  const { data: application } = await adminClient()
    .from("job_applications")
    .select("applicant_email, cv_path, status")
    .eq("job_id", jobId)
    .eq("applicant_email", guestApplicant.email)
    .single();
  expect(application?.status).toBe("new");
  expect(application?.cv_path).toMatch(new RegExp(`^applications/${jobId}/`));
});

test("apply API rejects bad files and foreign origins", async ({ request, baseURL }) => {
  const form = (cv: { name: string; mimeType: string; buffer: Buffer }) => ({
    jobId: jobSlug,
    applicantName: "Bad Actor",
    applicantEmail: testEmail(runId, "bad"),
    cv,
  });

  const wrongType = await request.post("/api/apply", {
    headers: { Origin: baseURL! },
    multipart: form({ name: "cv.txt", mimeType: "text/plain", buffer: Buffer.from("hello") }),
  });
  expect(wrongType.status()).toBe(400);

  const foreign = await request.post("/api/apply", {
    headers: { Origin: "https://evil.example" },
    multipart: form(testCv()),
  });
  expect(foreign.status()).toBe(403);

  const lookalike = await request.post("/api/apply", {
    headers: { Referer: `${new URL(baseURL!).origin}.evil.example/job/${jobSlug}` },
    multipart: form(testCv()),
  });
  expect(lookalike.status()).toBe(403);
});

test("apply API rate-limits rapid submissions", async ({ request, baseURL }) => {
  const statuses: number[] = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await request.post("/api/apply", {
      headers: { Origin: baseURL! },
      multipart: { jobId: jobSlug, applicantName: "x", applicantEmail: "not-an-email" },
    });
    statuses.push(response.status());
  }
  expect(statuses.slice(0, 5)).toEqual([400, 400, 400, 400, 400]);
  expect(statuses[5]).toBe(429);
});

test("guest clicking Save is asked to sign up", async ({ page }) => {
  await page.goto(`/job/${jobSlug}`);
  await page.getByRole("button", { name: "Save job" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Save this job" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Create free account" })).toHaveAttribute(
    "href",
    `/signup/job-seeker?redirect=${encodeURIComponent(`/job/${jobSlug}`)}`,
  );
});

test("job seeker can sign up from a job and return to it", async ({ page }) => {
  await page.goto(`/signup/job-seeker?redirect=${encodeURIComponent(`/job/${jobSlug}`)}`);
  await page.getByLabel("Full name").fill(seeker.name);
  await page.getByLabel("Email", { exact: true }).fill(seeker.email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel(/City/).fill("Chicago");
  await page.getByLabel(/State/).selectOption("IL");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(new RegExp(`/job/${jobSlug}$`));
});

test("job seeker can save a job and see it in Saved", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, seeker.email);
  await page.goto(`/job/${jobSlug}`);

  await page.getByRole("button", { name: "Save job" }).first().click();
  await expect(page.getByRole("button", { name: "Unsave job" }).first()).toBeVisible();

  await page.goto("/dashboard/saved");
  await expect(page.getByRole("link", { name: jobTitle }).first()).toBeVisible();

  await page.goto(`/job/${jobSlug}`);
  await expect(page.getByRole("button", { name: "Unsave job" }).first()).toBeVisible();
});

test("job seeker can update profile and upload a resume", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, seeker.email);
  await page.goto("/dashboard/profile");

  await page.getByLabel(/Phone/).fill("5551234567");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Profile updated.")).toBeVisible();

  await page.locator("input#resume").setInputFiles(testCv("seeker-resume.pdf"));
  await page.getByRole("button", { name: "Upload resume" }).click();
  await expect(page.getByText("Resume uploaded.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("seeker-resume.pdf")).toBeVisible();
});

test("signed-in job seeker applies with prefilled details", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, seeker.email);
  await page.goto(`/job/${jobSlug}`);

  const form = applicationForm(page);
  await expect(form.getByLabel("Full name")).toHaveValue(seeker.name);
  await expect(form.getByLabel("Email", { exact: true })).toHaveValue(seeker.email);
  await form.getByLabel(/CV \/ resume/).setInputFiles(testCv());
  await form.getByRole("button", { name: `Apply for ${jobTitle}` }).click();
  await expect(page.getByText(/Application sent\./)).toBeVisible();
});

test("job seeker cannot open employer pages", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, seeker.email);
  await page.goto("/dashboard/jobs");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto(`/dashboard/jobs/${jobId}/applications`);
  await expect(page.getByText(guestApplicant.name)).toHaveCount(0);
});

test("employer sees both applications and can change status", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, employer.email);
  await page.goto(`/dashboard/jobs/${jobId}/applications`);

  await expect(page.getByText(guestApplicant.name)).toBeVisible();
  await expect(page.getByText(seeker.name)).toBeVisible();

  const status = page.getByLabel("Application status").first();
  await status.selectOption("shortlisted");
  await expect(status).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel("Application status").first()).toHaveValue("shortlisted");
});

test("employer can deactivate a job, which closes it to applicants", async ({ browser, request, baseURL }) => {
  const page = await newPage(browser);
  await logIn(page, employer.email);
  await page.goto("/dashboard/jobs");

  await page.getByRole("button", { name: "Job actions" }).first().click();
  await page.getByRole("menuitem", { name: "Deactivate" }).click();
  await expect
    .poll(async () => {
      const { data } = await adminClient()
        .from("employer_jobs")
        .select("is_active")
        .eq("id", jobId)
        .single();
      return data?.is_active;
    })
    .toBe(false);

  const closed = await request.post("/api/apply", {
    headers: { Origin: baseURL! },
    multipart: {
      jobId: jobSlug,
      applicantName: "Late Applicant",
      applicantEmail: testEmail(runId, "late"),
      cv: testCv(),
    },
  });
  expect(closed.status()).toBe(404);
});

test("employer can delete a job", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, employer.email);
  await page.goto("/dashboard/jobs");

  await page.getByRole("button", { name: "Job actions" }).first().click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this posting?" });
  await dialog.getByRole("button", { name: "Delete posting" }).click();
  await expect(dialog).toBeHidden();

  await expect
    .poll(async () => {
      const { data } = await adminClient().from("employer_jobs").select("id").eq("id", jobId);
      return data?.length;
    })
    .toBe(0);
  await page.reload();
  await expect(page.getByRole("link", { name: jobTitle })).toHaveCount(0);
});

test("sign out ends the session", async ({ browser }) => {
  const page = await newPage(browser);
  await logIn(page, employer.email);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard/);
});
