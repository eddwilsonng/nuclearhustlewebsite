"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveSeekerOnboarding, type ActionState } from "@/lib/auth/actions";
import { CATEGORIES } from "@/lib/categorize";
import { US_STATES } from "@/lib/states";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { SelectField, TextField } from "@/components/ui/Field";
import type { JobSeekerProfile } from "@/lib/types";
import { AuthError } from "./AuthShared";

const FIELD_OPTIONS = CATEGORIES.filter((category) => category.id !== "other");

export function SeekerSetupForm({
  seeker,
  redirect,
  alreadySubscribed,
}: {
  seeker: JobSeekerProfile | null;
  redirect: string;
  alreadySubscribed: boolean;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(saveSeekerOnboarding, {});
  const value = (key: string, fallback: string | null | undefined) => state.values?.[key] ?? fallback ?? "";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="redirect" value={redirect} />
      {state.error ? <AuthError>{state.error}</AuthError> : null}

      <SelectField
        id="primaryCategory"
        label="Your field"
        defaultValue={value("primaryCategory", seeker?.primary_category)}
        error={state.fieldErrors?.primaryCategory}
      >
        <option value="">Choose the closest fit</option>
        {FIELD_OPTIONS.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name} — {category.description}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SelectField
          id="state"
          label="Home state"
          defaultValue={value("state", seeker?.state)}
          error={state.fieldErrors?.state}
        >
          <option value="">Select a state</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <TextField
          id="location"
          label="City"
          optional
          type="text"
          autoComplete="address-level2"
          defaultValue={value("location", seeker?.location)}
          error={state.fieldErrors?.location}
        />
      </div>

      <FileDropzone
        id="resume"
        name="resume"
        label={seeker?.resume_filename ? "Replace your resume" : "Add your resume (optional)"}
        accept=".pdf,.doc,.docx"
        hint="PDF or Word, up to 5 MB. Stored privately and only sent when you apply."
        maxBytes={5 * 1024 * 1024}
        error={state.fieldErrors?.resume}
        current={
          seeker?.resume_filename ? (
            <p className="font-sans text-sm text-secondary">
              On file: <span className="text-ink">{seeker.resume_filename}</span>
            </p>
          ) : undefined
        }
      />

      {alreadySubscribed ? (
        <p className="font-sans text-sm text-secondary">You already get the Monday jobs email.</p>
      ) : (
        <div className="flex items-start gap-3">
          <input
            id="weeklyDigest"
            name="weeklyDigest"
            type="checkbox"
            className="mt-1 size-4 shrink-0 accent-ink"
          />
          <label htmlFor="weeklyDigest" className="font-sans text-sm leading-relaxed text-ink">
            Email me each Monday with the roles that went live that week.{" "}
            <span className="text-secondary">One email a week. Unsubscribe from any of them.</span>
          </label>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={redirect}
          className="inline-flex min-h-11 items-center justify-center font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink"
        >
          Skip for now
        </Link>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}
