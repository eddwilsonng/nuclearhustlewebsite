"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { createJobPosting, updateJobPosting, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import {
  FieldDescription,
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

function OptionButton({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "border p-4 text-left transition-colors duration-150",
        selected ? "border-ink bg-surface" : "border-control hover:border-ink",
      )}
    >
      <p className="font-sans text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 font-sans text-sm text-secondary">{description}</p>
    </button>
  );
}

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

export function JobPostingForm({ job, mode, customAction }: JobPostingFormProps) {
  const action = customAction || (mode === "create" ? createJobPosting : updateJobPosting);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {});
  const errorRef = useRef<HTMLDivElement>(null);

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
    if (state.error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state.error]);

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
      <input type="hidden" name="applicationType" value={applicationType} />
      <input type="hidden" name="workMode" value={workMode} />

      {state.error && (
        <div ref={errorRef}>
          <DashboardAlert tone="error">{state.error}</DashboardAlert>
        </div>
      )}

      {state.success && mode === "edit" && (
        <DashboardAlert tone="success">Job posting updated.</DashboardAlert>
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
            aria-describedby="title-hint title-issues"
            aria-invalid={titleIssues.length > 0}
            placeholder="e.g. Electrical Design Engineer"
          />
          <FieldDescription id="title-hint">
            The role name only, as a candidate would search for it. Plant, location and
            work mode are set below and shown on the listing.
          </FieldDescription>
          <IssueList id="title-issues" issues={titleIssues} />
        </FieldGroup>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Select
              id="category"
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
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="employmentType">Employment type</FieldLabel>
            <Select
              id="employmentType"
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
        </FieldGroup>

        <fieldset className="space-y-2">
          <legend className="font-sans text-sm font-medium text-ink">Work mode</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {WORK_MODES.map((option) => (
              <OptionButton
                key={option.value}
                selected={workMode === option.value}
                onSelect={() => setWorkMode(option.value)}
                title={option.label}
                description={option.description}
              />
            ))}
          </div>
        </fieldset>

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
              name="city"
              type="text"
              required={workMode !== "remote"}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Pottstown"
            />
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
              name="salaryMin"
              inputMode="decimal"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder={salaryPeriod === "year" ? "95000" : "55"}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="salaryMax">Maximum ($)</FieldLabel>
            <Input
              id="salaryMax"
              name="salaryMax"
              inputMode="decimal"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder={salaryPeriod === "year" ? "130000" : "75"}
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="salaryPeriod">Per</FieldLabel>
            <Select
              id="salaryPeriod"
              name="salaryPeriod"
              required={Boolean(salaryMin || salaryMax)}
              value={salaryPeriod}
              onChange={(e) => setSalaryPeriod(e.target.value as SalaryPeriod | "")}
            >
              <option value="">Select</option>
              <option value="hour">Hour</option>
              <option value="year">Year</option>
            </Select>
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
                aria-describedby={`${id}-hint ${id}-issues`}
                aria-invalid={Boolean(contactIssue)}
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
            </FieldGroup>
          );
        })}
      </section>

      <section className="space-y-5">
        <DashboardSectionLabel>How to apply</DashboardSectionLabel>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <OptionButton
            selected={applicationType === "form"}
            onSelect={() => setApplicationType("form")}
            title="Receive by email"
            description="Candidates apply on Nuclear Hustle; applications land in your inbox with a CV"
          />
          <OptionButton
            selected={applicationType === "link"}
            onSelect={() => setApplicationType("link")}
            title="Link to your careers page"
            description="Send candidates to your own application page"
          />
        </div>

        {applicationType === "link" ? (
          <FieldGroup>
            <FieldLabel htmlFor="applicationUrl">Application URL</FieldLabel>
            <Input
              id="applicationUrl"
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
          </FieldGroup>
        ) : (
          <FieldGroup>
            <FieldLabel htmlFor="applicationEmail">Application email</FieldLabel>
            <Input
              id="applicationEmail"
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
                Feature this listing — $99
              </span>
              <span className="mt-1 block font-sans text-sm text-secondary">
                Pin it to the top of the board and homepage for 30 days. Checkout
                after posting. Skip to publish for free.
              </span>
            </span>
          </button>
        </section>
      )}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="compact" disabled={isPending}>
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
