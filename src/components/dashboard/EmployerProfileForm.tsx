"use client";

import { useActionState } from "react";
import { updateEmployerProfile, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import {
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@/components/ui/Field";
import {
  DashboardAlert,
  DashboardCard,
  DashboardPageHeader,
  DashboardSectionLabel,
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

  return (
    <div className="max-w-2xl">
      <DashboardPageHeader
        eyebrow="Employer"
        title="Company profile"
        description="Shown on your job listings."
      />

      <DashboardCard>
        <form action={formAction} className="space-y-5">
          {state.error && <DashboardAlert tone="error">{state.error}</DashboardAlert>}
          {state.success && (
            <DashboardAlert tone="success">Profile updated.</DashboardAlert>
          )}

          <FieldGroup>
            <FieldLabel htmlFor="fullName">Your name</FieldLabel>
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
            <Input
              id="email"
              name="email"
              type="email"
              disabled
              value={profile.email}
            />
            <FieldDescription>Email cannot be changed.</FieldDescription>
          </FieldGroup>

          <div className="border-t border-rule pt-5">
            <DashboardSectionLabel>Company</DashboardSectionLabel>
          </div>

          <FieldGroup>
            <FieldLabel htmlFor="companyName">Company name</FieldLabel>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              required
              defaultValue={employerProfile?.company_name || ""}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="companyWebsite">
              Website <span className="font-normal text-secondary">(optional)</span>
            </FieldLabel>
            <Input
              id="companyWebsite"
              name="companyWebsite"
              type="url"
              defaultValue={employerProfile?.company_website || ""}
              placeholder="https://company.com"
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="companyDescription">
              Description <span className="font-normal text-secondary">(optional)</span>
            </FieldLabel>
            <Textarea
              id="companyDescription"
              name="companyDescription"
              rows={4}
              defaultValue={employerProfile?.company_description || ""}
              placeholder="Tell job seekers about the plant, fleet, or contractor work."
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel htmlFor="companyLogo">
              Logo <span className="font-normal text-secondary">(optional)</span>
            </FieldLabel>
            {employerProfile?.company_logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employerProfile.company_logo_url}
                alt="Current company logo"
                className="mb-2 h-14 w-14 border border-rule bg-raised object-contain"
              />
            )}
            <Input
              id="companyLogo"
              name="companyLogo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
            />
            <FieldDescription>PNG, JPG, WEBP, or SVG. Max 2MB.</FieldDescription>
          </FieldGroup>

          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </DashboardCard>
    </div>
  );
}
