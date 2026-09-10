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
import type { EmployerJob } from "@/lib/types";

interface JobPostingFormProps {
  job?: EmployerJob;
  mode: "create" | "edit";
  customAction?: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}

const CATEGORIES = [
  { value: "operations", label: "Operations" },
  { value: "engineering", label: "Engineering" },
  { value: "maintenance", label: "Maintenance" },
  { value: "health-physics", label: "Health Physics" },
  { value: "security", label: "Security" },
  { value: "training", label: "Training & Licensing" },
  { value: "administrative", label: "Administrative" },
  { value: "other", label: "Other" },
];

const EMPLOYMENT_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
];

export function JobPostingForm({ job, mode, customAction }: JobPostingFormProps) {
  const action = customAction || (mode === "create" ? createJobPosting : updateJobPosting);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {});
  const errorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(job?.title ?? "");
  const [location, setLocation] = useState(job?.location ?? "");
  const [category, setCategory] = useState(job?.category ?? "");
  const [employmentType, setEmploymentType] = useState(job?.employment_type ?? "full-time");
  const [applicationType, setApplicationType] = useState<"link" | "form">(
    job?.application_type ?? "link",
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

  useEffect(() => {
    if (state.error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-8">
      {job && <input type="hidden" name="jobId" value={job.id} />}
      <input type="hidden" name="applicationType" value={applicationType} />

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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Reactor Operator"
          />
        </FieldGroup>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              name="location"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Charlotte, NC"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Select
              id="category"
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>

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
      </section>

      <section className="space-y-5">
        <div>
          <DashboardSectionLabel>Description</DashboardSectionLabel>
          <FieldDescription className="mt-2">
            Fill in the sections that apply. None are required on their own.
          </FieldDescription>
        </div>

        {(
          [
            {
              id: "about",
              label: "About this role",
              value: about,
              onChange: setAbout,
              placeholder: "Overview of the position and what the work involves.",
            },
            {
              id: "responsibilities",
              label: "Responsibilities",
              value: responsibilities,
              onChange: setResponsibilities,
              placeholder: "Operate and monitor reactor systems\nConduct routine inspections",
            },
            {
              id: "qualifications",
              label: "Qualifications",
              value: qualifications,
              onChange: setQualifications,
              placeholder: "NRC Senior Reactor Operator license\n5+ years experience",
            },
            {
              id: "desired",
              label: "Desired",
              value: desired,
              onChange: setDesired,
              placeholder: "Nice-to-have skills or experience",
            },
            {
              id: "locationDetails",
              label: "Location details",
              value: locationDetails,
              onChange: setLocationDetails,
              placeholder: "Site, shift, remote policy, relocation",
            },
            {
              id: "whatWeOffer",
              label: "What we offer",
              value: whatWeOffer,
              onChange: setWhatWeOffer,
              placeholder: "Pay range, benefits, pension, relocation",
            },
          ] as const
        ).map(({ id, label, value, onChange, placeholder }) => (
          <FieldGroup key={id}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Textarea
              id={id}
              name={id}
              rows={4}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
          </FieldGroup>
        ))}
      </section>

      <section className="space-y-5">
        <DashboardSectionLabel>How to apply</DashboardSectionLabel>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setApplicationType("link")}
            aria-pressed={applicationType === "link"}
            className={cn(
              "border p-4 text-left transition-colors duration-150",
              applicationType === "link"
                ? "border-ink bg-surface"
                : "border-control hover:border-ink",
            )}
          >
            <p className="font-sans text-sm font-semibold text-ink">Link to careers page</p>
            <p className="mt-1 font-sans text-sm text-secondary">
              Send applicants to your existing apply URL
            </p>
          </button>
          <button
            type="button"
            onClick={() => setApplicationType("form")}
            aria-pressed={applicationType === "form"}
            className={cn(
              "border p-4 text-left transition-colors duration-150",
              applicationType === "form"
                ? "border-ink bg-surface"
                : "border-control hover:border-ink",
            )}
          >
            <p className="font-sans text-sm font-semibold text-ink">Receive by email</p>
            <p className="mt-1 font-sans text-sm text-secondary">
              Applications land in your inbox with a CV
            </p>
          </button>
        </div>

        {applicationType === "link" ? (
          <FieldGroup>
            <FieldLabel htmlFor="applicationUrl">
              Application URL{" "}
              <span className="font-normal text-secondary">(optional)</span>
            </FieldLabel>
            <Input
              id="applicationUrl"
              name="applicationUrl"
              type="url"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://yourcompany.com/apply"
            />
          </FieldGroup>
        ) : (
          <FieldGroup>
            <FieldLabel htmlFor="applicationEmail">Application email</FieldLabel>
            <Input
              id="applicationEmail"
              name="applicationEmail"
              type="email"
              required={applicationType === "form"}
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
