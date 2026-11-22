"use client";

import { useActionState, useEffect } from "react";
import { updateEmployerProfile, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { SettingsSection } from "@/components/ui/Settings";
import { useToast } from "@/components/ui/Toast";
import { CompanyFields } from "@/components/dashboard/CompanyFields";
import {
  DashboardAlert,
  DashboardBody,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";
import type { Profile, EmployerProfile } from "@/lib/types";

export function EmployerProfileForm({
  profile,
  employerProfile,
}: {
  profile: Profile;
  employerProfile: EmployerProfile | null;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateEmployerProfile,
    {},
  );
  const toast = useToast();

  useEffect(() => {
    if (state.success && state.message) toast.success(state.message);
    // Toast once per completed save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <DashboardPageHeader
        title="Company"
        description="Shown beside every listing you post, and on your company page while you have a live listing."
      />
      <DashboardBody width="form">
        <form action={formAction} noValidate>
          {state.error ? (
            <div className="mb-6">
              <DashboardAlert tone="error">{state.error}</DashboardAlert>
            </div>
          ) : null}

          <SettingsSection title="Company details">
            <div className="space-y-5 py-5">
              <CompanyFields employer={employerProfile} state={state} />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Your details"
            description="Candidates don't see this. It's who we contact about your listings."
          >
            <div className="py-5">
              <TextField
                id="fullName"
                label="Your name"
                type="text"
                required
                autoComplete="name"
                defaultValue={state.values?.fullName ?? profile.full_name}
                error={state.fieldErrors?.fullName}
              />
            </div>
          </SettingsSection>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? "Saving…" : "Save company"}
            </Button>
          </div>
        </form>
      </DashboardBody>
    </>
  );
}
