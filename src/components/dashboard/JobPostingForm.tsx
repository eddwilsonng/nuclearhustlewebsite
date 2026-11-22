"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { createJobPosting, updateJobPosting, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { useToast } from "@/components/ui/Toast";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  Textarea,
} from "@/components/ui/Field";
import {
  DashboardAlert,
  DashboardSectionLabel,
} from "@/components/dashboard/DashboardChrome";
import { cn } from "@/lib/cn";
import { categorizeJob } from "@/lib/categorize";
import {
  FEATURED_DURATION_DAYS,
  featuredPriceLabel,
} from "@/lib/jobs/featuredOffer";
import { US_STATES } from "@/lib/states";
import {
  ABOUT_MAX_LENGTH,
  ABOUT_MIN_LENGTH,
  PLANT_OPTIONS,
  TITLE_MAX_LENGTH,
  getContactDetailsIssue,
  getPlantOption,
  getTitleIssues,
  parseLocation,
  stateSlugToCode,
  type SalaryPeriod,
  type WorkMode,
} from "@/lib/jobs/intake";
import type { EmployerJob } from "@/lib/types";

interface JobPostingFormProps {
  job?: EmployerJob;
  mode: "create" | "edit";
  customAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  /** Create mode: false until the employer's work email is confirmed. */
  canPublish?: boolean;
}

const CATEGORIES = [
  { value: "operations", label: "Operations — operators, control room, shift supervision" },
  { value: "engineering", label: "Engineering — design, system, project, licensing engineers" },
  { value: "maintenance", label: "Maintenance — craft, technicians, maintenance supervision" },
  { value: "health-physics", label: "Health Physics — RP, chemistry, radwaste" },
  { value: "security", label: "Security — officers and protective force" },
  { value: "training", label: "Training & Licensing — instructors, license classes" },
  { value: "administrative", label: "Administrative — project managers, planners, schedulers, QA" },
  { value: "other", label: "Other" },
];

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "contract", label: "Contract" },
  { value: "part-time", label: "Part-time" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
];

const WORK_MODES: { value: WorkMode; label: string; description: string }[] = [
  { value: "on-site", label: "On-site", description: "Works at the plant or office" },
  { value: "hybrid", label: "Hybrid", description: "Split between site and home" },
  { value: "remote", label: "Remote", description: "Works from home, with any site trips noted below" },
];

function IssueList({ id, issues }: { id: string; issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <ul id={id} aria-live="polite" className="space-y-1">
      {issues.map((issue) => (
        <li key={issue} className="font-sans text-sm font-medium text-danger">
          {issue}
        </li>
      ))}
    </ul>
  );
}

function ServerFieldError({ id, message }: { id: string; message?: string }) {
  return message ? <FieldError id={`${id}-error`}>{message}</FieldError> : null;
}

export function JobPostingForm({ job, mode, customAction, canPublish = true }: JobPostingFormProps) {
  const action = customAction || (mode === "create" ? createJobPosting : updateJobPosting);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {});
  const errorRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const fieldError = (name: string) => state.fieldErrors?.[name];

  const initialLocation = parseLocation(job?.location ?? "");
  const initialWorkMode: WorkMode =
    job?.work_mode ?? (/^remote\b/i.test(job?.location ?? "") ? "remote" : "on-site");

  const [title, setTitle] = useState(job?.title ?? "");
  const [category, setCategory] = useState(job?.category ?? "");
  const [categoryTouched, setCategoryTouched] = useState(Boolean(job));
  const [employmentType, setEmploymentType] = useState(job?.employment_type ?? "full-time");

  const [workMode, setWorkMode] = useState<WorkMode>(initialWorkMode);
  const [plantId, setPlantId] = useState(job?.plant_id ?? "");
  const [city, setCity] = useState(initialLocation.city);
  const [stateCode, setStateCode] = useState(
    initialLocation.stateCode || stateSlugToCode(job?.state),
  );

  const [salaryMin, setSalaryMin] = useState(job?.salary_min?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(job?.salary_max?.toString() ?? "");
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod | "">(job?.salary_period ?? "");

  const [applicationType, setApplicationType] = useState<"link" | "form">(
    job?.application_type ?? "form",
  );
  const [applicationUrl, setApplicationUrl] = useState(job?.application_url ?? "");
  const [applicationEmail, setApplicationEmail] = useState(job?.application_email ?? "");
  const [feature, setFeature] = useState(false);

  const sd = job?.structured_description;
  const [about, setAbout] = useState(sd?.about ?? "");
  const [responsibilities, setResponsibilities] = useState(sd?.responsibilities ?? "");
  const [qualifications, setQualifications] = useState(sd?.qualifications ?? "");
  const [desired, setDesired] = useState(sd?.desired ?? "");
  const [locationDetails, setLocationDetails] = useState(sd?.location_details ?? "");
  const [whatWeOffer, setWhatWeOffer] = useState(sd?.what_we_offer ?? "");

  const titleIssues = title.trim() ? getTitleIssues(title) : [];

  useEffect(() => {
    // Take the user to the field that needs fixing; fall back to the summary.
    const field = state.fieldErrors ? Object.keys(state.fieldErrors)[0] : undefined;
    const target = field ? document.getElementById(field) : null;
    if (target) {
      target.focus();
      target.scrollIntoView({ block: "center" });
    } else if (state.error && errorRef.current) {
      errorRef.current.scrollIntoView({ block: "center" });
    }
    if (state.success && mode === "edit") toast.success(state.message ?? "Changes saved.");
    // Runs once per submit result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!categoryTouched) {
      const suggested = categorizeJob(value);
      setCategory(suggested === "other" ? "" : suggested);
    }
  }

  function handlePlantChange(id: string) {
    setPlantId(id);
    const plant = getPlantOption(id);
    if (plant) {
      setCity(plant.city);
      setStateCode(plant.state);
    }
  }

  const descriptionFields = [
    {
      id: "about",
      label: "About this role",
      required: true,
      value: about,
      onChange: setAbout,
      rows: 5,
      hint: `2–4 sentences: what the work is, which project or outage it supports, and who it reports to. ${ABOUT_MIN_LENGTH}–${ABOUT_MAX_LENGTH} characters.`,
      placeholder:
        "Support the Extended Power Uprate project team with engineering documentation, technical evaluations, and licensing activities.",
    },
    {
      id: "responsibilities",
      label: "Responsibilities",
      required: true,
      value: responsibilities,
      onChange: setResponsibilities,
      rows: 6,
      hint: "One per line. Each line becomes a bullet.",
      placeholder: "Develop design change packages\nPerform 10 CFR 50.59 screenings\nSupport field walkdowns",
    },
    {
      id: "qualifications",
      label: "Required qualifications",
      required: true,
      value: qualifications,
      onChange: setQualifications,
      rows: 5,
      hint: "One per line. Only what a candidate must have.",
      placeholder: "Bachelor's in engineering\n10+ years of commercial nuclear experience",
    },
    {
      id: "desired",
      label: "Preferred qualifications",
      required: false,
      value: desired,
      onChange: setDesired,
      rows: 4,
      hint: "One per line.",
      placeholder: "BWR experience\nPE license",
    },
    {
      id: "locationDetails",
      label: "Schedule and duration",
      required: false,
      value: locationDetails,
      onChange: setLocationDetails,
      rows: 3,
      hint: "Start and end dates, hours, shift, and site travel.",
      placeholder: "Start: November 2026\nEnd: 2031 (end of project)\nSchedule: 40 hours/week, day shift",
    },
    {
      id: "whatWeOffer",
      label: "Benefits",
      required: false,
      value: whatWeOffer,
      onChange: setWhatWeOffer,
      rows: 3,
      hint: "Benefits, per diem, relocation. Pay goes in the pay fields above.",
      placeholder: "Medical, dental, vision\nPer diem for non-local candidates",
    },
  ] as const;

  return (
    <form action={formAction} className="space-y-10">
      {job && <input type="hidden" name="jobId" value={job.id} />}

      {state.error && !state.fieldErrors && (
        <div ref={errorRef}>
          <DashboardAlert tone="error">{state.error}</DashboardAlert>
        </div>
      )}

      <section className="space-y-5">
        <DashboardSectionLabel>Role</DashboardSectionLabel>

        <FieldGroup>
          <FieldLabel htmlFor="title">Job title</FieldLabel>
          <Input
            id="title"
            name="title"
            type="text"
            required
            maxLength={TITLE_MAX_LENGTH + 20}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            aria-describedby="title-hint title-issues title-error"
            aria-invalid={titleIssues.length > 0 || Boolean(fieldError("title"))}
            placeholder="e.g. Electrical Design Engineer"
          />
          <FieldDescription id="title-hint">
            The role name only, as a candidate would search for it. Plant, location and
            work mode are set below and shown on the listing.
          </FieldDescription>
          <IssueList id="title-issues" issues={titleIssues} />
          <ServerFieldError id="title" message={fieldError("title")} />
        </FieldGroup>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Select
              id="category"
              aria-invalid={fieldError("category") ? true : undefined}
              aria-describedby={fieldError("category") ? "category-error" : undefined}
              name="category"
              required
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCategoryTouched(true);
              }}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
            {!categoryTouched && category && (
              <FieldDescription>Suggested from the title. Change it if it&apos;s wrong.</FieldDescription>
            )}
            <ServerFieldError id="category" message={fieldError("category")} />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="employmentType">Employment type</FieldLabel>
            <Select
              id="employmentType"
              aria-invalid={fieldError("employmentType") ? true : undefined}
              aria-describedby={fieldError("employmentType") ? "employmentType-error" : undefined}
              name="employmentType"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            <ServerFieldError id="employmentType" message={fieldError("employmentType")} />
          </FieldGroup>
        </div>
      </section>

      <section className="space-y-5">
        <DashboardSectionLabel>Location</DashboardSectionLabel>

        <FieldGroup>
          <FieldLabel htmlFor="plantId">
            Plant <span className="font-normal text-secondary">(optional)</span>
          </FieldLabel>
          <Select
            id="plantId"
            aria-invalid={fieldError("plantId") ? true : undefined}
            aria-describedby={fieldError("plantId") ? "plantId-error" : undefined}
            name="plantId"
            value={plantId}
            onChange={(e) => handlePlantChange(e.target.value)}
          >
            <option value="">Not tied to a specific plant</option>
            {PLANT_OPTIONS.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name} — {plant.city}, {plant.state}
              </option>
            ))}
          </Select>
          <FieldDescription>
            The plant this role supports, including remote roles. Fills in the city and state.
          </FieldDescription>
          <ServerFieldError id="plantId" message={fieldError("plantId")} />
        </FieldGroup>

        <ChoiceGroup<WorkMode>
          name="workMode"
          label="Work mode"
          columns={3}
          value={workMode}
          onValueChange={setWorkMode}
          options={WORK_MODES}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <FieldGroup>
            <FieldLabel htmlFor="city">
              City
              {workMode === "remote" && (
                <span className="font-normal text-secondary"> (optional for remote)</span>
              )}
            </FieldLabel>
            <Input
              id="city"
              aria-invalid={fieldError("city") ? true : undefined}
              aria-describedby={fieldError("city") ? "city-error" : undefined}
              name="city"
              type="text"
              required={workMode !== "remote"}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pottstown"
            />
            <ServerFieldError id="city" message={fieldError("city")} />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="stateCode">
              State
              {workMode === "remote" && (
                <span className="font-normal text-secondary"> (optional)</span>
              )}
            </FieldLabel>
            <Select
              id="stateCode"
              aria-invalid={fieldError("stateCode") ? true : undefined}
              aria-describedby={fieldError("stateCode") ? "stateCode-error" : undefined}
              name="stateCode"
              required={workMode !== "remote"}
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
            >
              <option value="">Select</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </Select>
            <ServerFieldError id="stateCode" message={fieldError("stateCode")} />
          </FieldGroup>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <DashboardSectionLabel>Pay</DashboardSectionLabel>
          <FieldDescription className="mt-2">
            Optional, but shown on the listing and sent to Google for Jobs. Leave max blank
            for a single rate.
          </FieldDescription>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldGroup>
            <FieldLabel htmlFor="salaryMin">Minimum ($)</FieldLabel>
            <Input
              id="salaryMin"
              aria-invalid={fieldError("salaryMin") ? true : undefined}
              aria-describedby={fieldError("salaryMin") ? "salaryMin-error" : undefined}
              name="salaryMin"
              inputMode="decimal"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder={salaryPeriod === "year" ? "95000" : "55"}
            />
            <ServerFieldError id="salaryMin" message={fieldError("salaryMin")} />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="salaryMax">Maximum ($)</FieldLabel>
            <Input
              id="salaryMax"
              aria-invalid={fieldError("salaryMax") ? true : undefined}
              aria-describedby={fieldError("salaryMax") ? "salaryMax-error" : undefined}
              name="salaryMax"
              inputMode="decimal"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder={salaryPeriod === "year" ? "130000" : "75"}
            />
            <ServerFieldError id="salaryMax" message={fieldError("salaryMax")} />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="salaryPeriod">Per</FieldLabel>
            <Select
              id="salaryPeriod"
              aria-invalid={fieldError("salaryPeriod") ? true : undefined}
              aria-describedby={fieldError("salaryPeriod") ? "salaryPeriod-error" : undefined}
              name="salaryPeriod"
              required={Boolean(salaryMin || salaryMax)}
              value={salaryPeriod}
              onChange={(e) => setSalaryPeriod(e.target.value as SalaryPeriod | "")}
            >
              <option value="">Select</option>
              <option value="hour">Hour</option>
              <option value="year">Year</option>
            </Select>
            <ServerFieldError id="salaryPeriod" message={fieldError("salaryPeriod")} />
          </FieldGroup>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <DashboardSectionLabel>Description</DashboardSectionLabel>
          <FieldDescription className="mt-2">
            Keep each section to its own topic. Leave out email addresses, links and
            &ldquo;send your resume&rdquo; lines — candidates apply with the Apply button,
            and your company profile covers the company boilerplate.
          </FieldDescription>
        </div>

        {descriptionFields.map(({ id, label, required, value, onChange, rows, hint, placeholder }) => {
          const contactIssue = value ? getContactDetailsIssue(value) : null;
          return (
            <FieldGroup key={id}>
              <FieldLabel htmlFor={id}>
                {label}
                {!required && <span className="font-normal text-secondary"> (optional)</span>}
              </FieldLabel>
              <Textarea
                id={id}
                name={id}
                rows={rows}
                required={required}
                maxLength={id === "about" ? ABOUT_MAX_LENGTH + 200 : undefined}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-describedby={`${id}-hint ${id}-issues ${id}-error`}
                aria-invalid={Boolean(contactIssue) || Boolean(fieldError(id))}
                placeholder={placeholder}
              />
              <FieldDescription id={`${id}-hint`}>
                {hint}
                {id === "about" && (
                  <span
                    className={cn(
                      "ml-2 font-mono text-xs tabular-nums",
                      about.trim().length > ABOUT_MAX_LENGTH ? "text-danger" : "text-secondary",
                    )}
                  >
                    {about.trim().length}/{ABOUT_MAX_LENGTH}
                  </span>
                )}
              </FieldDescription>
              <IssueList id={`${id}-issues`} issues={contactIssue ? [contactIssue] : []} />
              {contactIssue ? null : <ServerFieldError id={id} message={fieldError(id)} />}
            </FieldGroup>
          );
        })}
      </section>

      <section className="space-y-5">
        <DashboardSectionLabel>How to apply</DashboardSectionLabel>

        <ChoiceGroup<"form" | "link">
          name="applicationType"
          label="How candidates apply"
          columns={2}
          value={applicationType}
          onValueChange={setApplicationType}
          options={[
            {
              value: "form",
              label: "Receive by email",
              description: "Candidates apply on Nuclear Hustle. Each application lands in your inbox and under Applicants, with a CV.",
            },
            {
              value: "link",
              label: "Link to your careers page",
              description: "Send candidates to your own application page.",
            },
          ]}
        />

        {applicationType === "link" ? (
          <FieldGroup>
            <FieldLabel htmlFor="applicationUrl">Application URL</FieldLabel>
            <Input
              id="applicationUrl"
              aria-invalid={fieldError("applicationUrl") ? true : undefined}
              aria-describedby={fieldError("applicationUrl") ? "applicationUrl-error" : undefined}
              name="applicationUrl"
              type="url"
              required
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://yourcompany.com/careers/job-123"
            />
            <FieldDescription>
              Link straight to this role&apos;s application, not your careers homepage.
            </FieldDescription>
            <ServerFieldError id="applicationUrl" message={fieldError("applicationUrl")} />
          </FieldGroup>
        ) : (
          <FieldGroup>
            <FieldLabel htmlFor="applicationEmail">Application email</FieldLabel>
            <Input
              id="applicationEmail"
              aria-invalid={fieldError("applicationEmail") ? true : undefined}
              aria-describedby={fieldError("applicationEmail") ? "applicationEmail-error" : undefined}
              name="applicationEmail"
              type="email"
              required
              value={applicationEmail}
              onChange={(e) => setApplicationEmail(e.target.value)}
              placeholder="hiring@yourcompany.com"
            />
            <FieldDescription>
              Applications will be emailed here with the candidate&apos;s CV attached.
            </FieldDescription>
            <ServerFieldError id="applicationEmail" message={fieldError("applicationEmail")} />
          </FieldGroup>
        )}
      </section>

      {mode === "create" && (
        <section className="border-t border-rule pt-8">
          <input type="hidden" name="feature" value={feature ? "on" : ""} />
          <button
            type="button"
            onClick={() => setFeature((f) => !f)}
            aria-pressed={feature}
            className={cn(
              "flex w-full items-start gap-3 text-left transition-colors duration-150",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center border",
                feature
                  ? "border-signal bg-signal text-ink"
                  : "border-control bg-raised text-transparent",
              )}
              aria-hidden="true"
            >
              ✓
            </span>
            <span>
              <span className="block font-sans text-sm font-semibold text-ink">
                Feature this listing — {featuredPriceLabel()}
              </span>
              <span className="mt-1 block font-sans text-sm text-secondary">
                Pin it to the top of the board and homepage for {FEATURED_DURATION_DAYS}{" "}
                days, with a Featured badge, and include it in every Monday digest
                sent during that time. Checkout after posting. Skip to publish for
                free.
              </span>
            </span>
          </button>
          {feature ? (
            <div className="mt-4 flex items-start gap-3">
              <input
                id="feature-terms"
                name="acceptedTerms"
                type="checkbox"
                required
                className="mt-1 size-4 shrink-0 accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              />
              <div className="font-sans text-sm leading-relaxed text-secondary">
                <label htmlFor="feature-terms" className="text-ink">
                  I agree to the Terms of Service for this {featuredPriceLabel()} featured listing.
                  The fee is refunded only if the listing never goes live as featured.
                </label>{" "}
                <a href="/terms" className="text-ink underline underline-offset-2">
                  Terms
                </a>
              </div>
            </div>
          ) : null}
        </section>
      )}

      <div className="flex flex-col items-end gap-2">
        {state.fieldErrors ? (
          <FieldError>Fix the highlighted field above, then try again.</FieldError>
        ) : null}
        {mode === "create" && !canPublish ? (
          <p className="font-sans text-sm text-secondary">Confirm your work email above to publish.</p>
        ) : null}
        <Button type="submit" variant="primary" disabled={isPending || (mode === "create" && !canPublish)}>
          {isPending
            ? mode === "create"
              ? feature
                ? "Posting…"
                : "Creating…"
              : "Saving…"
            : mode === "create"
              ? feature
                ? "Post and feature"
                : "Post job"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
