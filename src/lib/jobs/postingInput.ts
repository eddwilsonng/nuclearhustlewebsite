import { z } from "zod";
import { getAllCategories, type JobCategory } from "@/lib/categorize";
import type { StructuredDescription } from "@/lib/types";
import {
  ABOUT_MAX_LENGTH,
  ABOUT_MIN_LENGTH,
  composeLocation,
  getContactDetailsIssue,
  getPlantOption,
  getTitleIssues,
  normalizeList,
  normalizeProse,
  parseSalaryAmount,
  stateCodeToSlug,
  TITLE_MAX_LENGTH,
} from "@/lib/jobs/intake";

export const EMPLOYMENT_TYPE_VALUES = [
  "full-time",
  "part-time",
  "contract",
  "temporary",
  "internship",
] as const;

const SALARY_BOUNDS = {
  hour: { min: 10, max: 500 },
  year: { min: 20_000, max: 1_000_000 },
} as const;

const postingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(TITLE_MAX_LENGTH, `Keep the title under ${TITLE_MAX_LENGTH} characters`),
  category: z.string().refine((value) => getAllCategories().includes(value as JobCategory), {
    message: "Pick a category",
  }),
  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES, { message: "Pick an employment type" }),
  workMode: z.enum(["on-site", "hybrid", "remote"], { message: "Pick a work mode" }),
  plantId: z.string().optional(),
  city: z.string().trim().optional(),
  stateCode: z.string().trim().optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  salaryPeriod: z.enum(["hour", "year"]).optional().or(z.literal("")),
  applicationType: z.enum(["link", "form"]),
  applicationUrl: z.string().trim().optional(),
  applicationEmail: z.string().trim().optional(),
  about: z.string().optional(),
  responsibilities: z.string().optional(),
  qualifications: z.string().optional(),
  desired: z.string().optional(),
  locationDetails: z.string().optional(),
  whatWeOffer: z.string().optional(),
});

export interface EmployerJobWrite {
  title: string;
  location: string;
  state: string | null;
  category: JobCategory;
  description: string;
  structured_description: StructuredDescription;
  employment_type: string;
  work_mode: "on-site" | "hybrid" | "remote";
  plant_id: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: "hour" | "year" | null;
  application_type: "link" | "form";
  application_url: string | null;
  application_email: string | null;
}

type ParseResult = { ok: true; data: EmployerJobWrite } | { ok: false; error: string };

function field(formData: FormData, name: string): string {
  return (formData.get(name) as string | null) ?? "";
}

export function parseJobPostingForm(formData: FormData): ParseResult {
  const parsed = postingSchema.safeParse({
    title: field(formData, "title"),
    category: field(formData, "category"),
    employmentType: field(formData, "employmentType"),
    workMode: field(formData, "workMode"),
    plantId: field(formData, "plantId"),
    city: field(formData, "city"),
    stateCode: field(formData, "stateCode"),
    salaryMin: field(formData, "salaryMin"),
    salaryMax: field(formData, "salaryMax"),
    salaryPeriod: field(formData, "salaryPeriod"),
    applicationType: field(formData, "applicationType") || "link",
    applicationUrl: field(formData, "applicationUrl"),
    applicationEmail: field(formData, "applicationEmail"),
    about: field(formData, "about"),
    responsibilities: field(formData, "responsibilities"),
    qualifications: field(formData, "qualifications"),
    desired: field(formData, "desired"),
    locationDetails: field(formData, "locationDetails"),
    whatWeOffer: field(formData, "whatWeOffer"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const input = parsed.data;

  const titleIssue = getTitleIssues(input.title)[0];
  if (titleIssue) return { ok: false, error: titleIssue };

  // Location
  const plant = getPlantOption(input.plantId);
  if (input.plantId && !plant) return { ok: false, error: "Pick a plant from the list" };

  const stateCode = input.stateCode || plant?.state || "";
  const city = input.city || plant?.city || "";
  const state = stateCode ? stateCodeToSlug(stateCode) : null;

  if (input.workMode !== "remote") {
    if (!city) return { ok: false, error: "Add the city the role is based in" };
    if (!state) return { ok: false, error: "Pick the state the role is based in" };
  } else if (stateCode && !state) {
    return { ok: false, error: "Pick a valid state" };
  }

  // Pay
  const salaryMin = parseSalaryAmount(input.salaryMin ?? "");
  const salaryMax = parseSalaryAmount(input.salaryMax ?? "");
  const salaryPeriod = input.salaryPeriod || null;

  if ((input.salaryMin && salaryMin === null) || (input.salaryMax && salaryMax === null)) {
    return { ok: false, error: "Pay must be a number, e.g. 55 or 95000" };
  }
  if ((salaryMin || salaryMax) && !salaryPeriod) {
    return { ok: false, error: "Choose whether pay is per hour or per year" };
  }
  if (salaryMin && salaryMax && salaryMin > salaryMax) {
    return { ok: false, error: "Minimum pay can't be higher than maximum pay" };
  }
  if (salaryPeriod) {
    const bounds = SALARY_BOUNDS[salaryPeriod];
    for (const amount of [salaryMin, salaryMax]) {
      if (amount !== null && (amount < bounds.min || amount > bounds.max)) {
        return {
          ok: false,
          error:
            salaryPeriod === "hour"
              ? "Hourly pay looks off — enter dollars per hour, e.g. 55 to 75"
              : "Annual pay looks off — enter dollars per year, e.g. 95000 to 130000",
        };
      }
    }
  }

  // Description
  const about = normalizeProse(input.about ?? "");
  const responsibilities = normalizeList(input.responsibilities ?? "");
  const qualifications = normalizeList(input.qualifications ?? "");
  const desired = normalizeList(input.desired ?? "");
  const locationDetails = normalizeProse(input.locationDetails ?? "");
  const whatWeOffer = normalizeProse(input.whatWeOffer ?? "");

  if (about.length < ABOUT_MIN_LENGTH) {
    return { ok: false, error: `Add a short overview of the role (at least ${ABOUT_MIN_LENGTH} characters)` };
  }
  if (about.length > ABOUT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Keep the overview under ${ABOUT_MAX_LENGTH} characters — move duties and requirements into their own sections`,
    };
  }
  if (!responsibilities) return { ok: false, error: "Add at least one responsibility" };
  if (!qualifications) return { ok: false, error: "Add at least one required qualification" };

  for (const text of [about, responsibilities, qualifications, desired, locationDetails, whatWeOffer]) {
    const issue = getContactDetailsIssue(text);
    if (issue) return { ok: false, error: issue };
  }

  // Application
  if (input.applicationType === "link") {
    const url = input.applicationUrl ?? "";
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      return { ok: false, error: "Add the full application link, starting with https://" };
    }
  } else if (!z.string().email().safeParse(input.applicationEmail).success) {
    return { ok: false, error: "Add the email address applications should go to" };
  }

  const structured: StructuredDescription = {
    about,
    responsibilities,
    qualifications,
    desired: desired || undefined,
    location_details: locationDetails || undefined,
    what_we_offer: whatWeOffer || undefined,
  };

  const description = [
    `About this Role\n${about}`,
    `Responsibilities\n${responsibilities}`,
    `Qualifications\n${qualifications}`,
    desired && `Desired\n${desired}`,
    locationDetails && `Schedule and Duration\n${locationDetails}`,
    whatWeOffer && `What We Offer\n${whatWeOffer}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    ok: true,
    data: {
      title: input.title,
      location: composeLocation(input.workMode, city, stateCode),
      state,
      category: input.category as JobCategory,
      description,
      structured_description: structured,
      employment_type: input.employmentType,
      work_mode: input.workMode,
      plant_id: plant?.id ?? null,
      salary_min: salaryMin,
      salary_max: salaryMax,
      salary_period: salaryMin || salaryMax ? salaryPeriod : null,
      application_type: input.applicationType,
      application_url: input.applicationType === "link" ? input.applicationUrl || null : null,
      application_email: input.applicationType === "form" ? input.applicationEmail || null : null,
    },
  };
}
