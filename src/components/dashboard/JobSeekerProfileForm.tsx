"use client";

import { useActionState, useState } from "react";
import { updateJobSeekerProfile, type ActionState } from "@/lib/auth/actions";
import { ResumeUpload } from "@/components/dashboard/ResumeUpload";
import { US_STATES } from "@/lib/states";
import { Button } from "@/components/ui/Button";
import {
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
} from "@/components/ui/Field";
import {
  DashboardAlert,
  DashboardBody,
  DashboardPageHeader,
  DashboardSectionLabel,
} from "@/components/dashboard/DashboardChrome";
import { cn } from "@/lib/cn";
import type { Profile, JobSeekerProfile } from "@/lib/types";

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
  const [isActivelyLooking, setIsActivelyLooking] = useState(
    jobSeekerProfile?.is_actively_looking ?? true,
  );

  return (
    <>
      <DashboardPageHeader title="Profile" />
      <DashboardBody width="form">
        <form action={formAction} className="space-y-5">
          <DashboardSectionLabel>Personal</DashboardSectionLabel>

          {state.error && <DashboardAlert tone="error">{state.error}</DashboardAlert>}
          {state.success && (
            <DashboardAlert tone="success">Profile updated.</DashboardAlert>
          )}

          <FieldGroup>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={profile.full_name}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" disabled value={profile.email} />
            <FieldDescription>Email cannot be changed.</FieldDescription>
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="phone">
              Phone <span className="font-normal text-secondary">(optional)</span>
            </FieldLabel>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={jobSeekerProfile?.phone || ""}
              placeholder="(555) 123-4567"
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel htmlFor="location">
                City <span className="font-normal text-secondary">(optional)</span>
              </FieldLabel>
              <Input
                id="location"
                name="location"
                type="text"
                defaultValue={jobSeekerProfile?.location || ""}
                placeholder="Chicago"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="state">
                State <span className="font-normal text-secondary">(optional)</span>
              </FieldLabel>
              <Select id="state" name="state" defaultValue={jobSeekerProfile?.state || ""}>
                <option value="">Select a state</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>

          <FieldGroup>
            <span className="block font-sans text-sm font-medium text-ink">
              Looking status
            </span>
            <input type="hidden" name="isActivelyLooking" value={String(isActivelyLooking)} />
            <div className="flex border border-control">
              <button
                type="button"
                onClick={() => setIsActivelyLooking(true)}
                className={cn(
                  "min-h-11 flex-1 font-sans text-sm transition-colors duration-150",
                  isActivelyLooking
                    ? "bg-canvas font-medium text-ink"
                    : "text-secondary hover:text-ink",
                )}
              >
                Open to opportunities
              </button>
              <button
                type="button"
                onClick={() => setIsActivelyLooking(false)}
                className={cn(
                  "min-h-11 flex-1 font-sans text-sm transition-colors duration-150",
                  !isActivelyLooking
                    ? "bg-canvas font-medium text-ink"
                    : "text-secondary hover:text-ink",
                )}
              >
                Not looking
              </button>
            </div>
          </FieldGroup>

          <Button type="submit" variant="primary" size="compact" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </form>

        <div className="mt-10 border-t border-rule pt-8">
          <DashboardSectionLabel>Resume</DashboardSectionLabel>
          <div className="mt-4">
            <ResumeUpload
              hasResume={!!jobSeekerProfile?.resume_url}
              currentFilename={jobSeekerProfile?.resume_filename || null}
            />
          </div>
        </div>
      </DashboardBody>
    </>
  );
}
