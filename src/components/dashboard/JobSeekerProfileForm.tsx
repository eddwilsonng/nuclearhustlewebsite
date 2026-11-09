"use client";

import { useActionState, useEffect, useState } from "react";
import { updateJobSeekerProfile, type ActionState } from "@/lib/auth/actions";
import { CATEGORIES } from "@/lib/categorize";
import { US_STATES } from "@/lib/states";
import { ResumeUpload } from "@/components/dashboard/ResumeUpload";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { SelectField, TextField } from "@/components/ui/Field";
import { SettingsSection } from "@/components/ui/Settings";
import { useToast } from "@/components/ui/Toast";
import {
  DashboardAlert,
  DashboardBody,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";
import type { Profile, JobSeekerProfile } from "@/lib/types";

const FIELD_OPTIONS = CATEGORIES.filter((category) => category.id !== "other");

export function JobSeekerProfileForm({
  profile,
  jobSeekerProfile,
}: {
  profile: Profile;
  jobSeekerProfile: JobSeekerProfile | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateJobSeekerProfile,
    {},
  );
  const toast = useToast();
  const [looking, setLooking] = useState<"true" | "false">(
    jobSeekerProfile?.is_actively_looking === false ? "false" : "true",
  );
  const value = (key: string, fallback: string | null | undefined) => state.values?.[key] ?? fallback ?? "";

  useEffect(() => {
    if (state.success && state.message) toast.success(state.message);
    // Toast once per completed save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <DashboardPageHeader
        title="Profile"
        description="Used to match roles to you and to prefill applications. Employers only see it when you apply."
      />
      <DashboardBody width="form">
        <form action={formAction} noValidate>
          {state.error ? (
            <div className="mb-6">
              <DashboardAlert tone="error">{state.error}</DashboardAlert>
            </div>
          ) : null}

          <SettingsSection title="About you">
            <div className="space-y-5 py-5">
              <TextField
                id="fullName"
                label="Full name"
                type="text"
                required
                autoComplete="name"
                defaultValue={value("fullName", profile.full_name)}
                error={state.fieldErrors?.fullName}
              />
              <TextField
                id="phone"
                label="Phone"
                optional
                type="tel"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                description="Added to applications you send, so employers can call you."
                defaultValue={value("phone", jobSeekerProfile?.phone)}
                error={state.fieldErrors?.phone}
              />
              <ChoiceGroup<"true" | "false">
                name="isActivelyLooking"
                label="Looking status"
                variant="segmented"
                value={looking}
                onValueChange={setLooking}
                options={[
                  { value: "true", label: "Open to opportunities" },
                  { value: "false", label: "Not looking" },
                ]}
              />
            </div>
          </SettingsSection>

          <div id="matching" className="scroll-mt-24">
            <SettingsSection
              title="Job matching"
              description="Your overview lists new roles in this field and state first."
            >
              <div className="space-y-5 py-5">
                <SelectField
                  id="primaryCategory"
                  label="Your field"
                  defaultValue={value("primaryCategory", jobSeekerProfile?.primary_category)}
                  error={state.fieldErrors?.primaryCategory}
                >
                  <option value="">Any field</option>
                  {FIELD_OPTIONS.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} — {category.description}
                    </option>
                  ))}
                </SelectField>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    id="state"
                    label="Home state"
                    defaultValue={value("state", jobSeekerProfile?.state)}
                    error={state.fieldErrors?.state}
                  >
                    <option value="">Any state</option>
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
                    defaultValue={value("location", jobSeekerProfile?.location)}
                    error={state.fieldErrors?.location}
                  />
                </div>
              </div>
            </SettingsSection>
          </div>

          <div className="flex justify-end pb-2">
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>

        <div id="resume" className="scroll-mt-24">
          <SettingsSection
            title="Resume"
            description="Stored privately. It is only sent to an employer when you apply and choose to use it."
          >
            <div className="py-5">
              <ResumeUpload
                hasResume={!!jobSeekerProfile?.resume_url}
                currentFilename={jobSeekerProfile?.resume_filename || null}
              />
            </div>
          </SettingsSection>
        </div>
      </DashboardBody>
    </>
  );
}
