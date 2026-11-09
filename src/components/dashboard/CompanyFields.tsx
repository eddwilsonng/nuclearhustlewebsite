"use client";

import { FileDropzone } from "@/components/ui/FileDropzone";
import { TextField, TextareaField } from "@/components/ui/Field";
import type { ActionState } from "@/lib/auth/actions";
import type { EmployerProfile } from "@/lib/types";

/** The company fields shared by onboarding step 2 and the Company page. */
export function CompanyFields({
  employer,
  state,
}: {
  employer: EmployerProfile | null;
  state: ActionState;
}) {
  const value = (key: string, fallback: string | null | undefined) => state.values?.[key] ?? fallback ?? "";

  return (
    <>
      <TextField
        id="companyName"
        label="Company name"
        type="text"
        required
        autoComplete="organization"
        defaultValue={value("companyName", employer?.company_name)}
        error={state.fieldErrors?.companyName}
      />

      <TextField
        id="companyWebsite"
        label="Website"
        optional
        type="url"
        inputMode="url"
        placeholder="https://company.com"
        defaultValue={value("companyWebsite", employer?.company_website)}
        error={state.fieldErrors?.companyWebsite}
      />

      <TextareaField
        id="companyDescription"
        label="About the company"
        optional
        rows={4}
        placeholder="The plants, fleet or project work you hire for, and where."
        description="Shown beside every listing. Two or three sentences is enough."
        defaultValue={value("companyDescription", employer?.company_description)}
        error={state.fieldErrors?.companyDescription}
      />

      <FileDropzone
        id="companyLogo"
        name="companyLogo"
        label={employer?.company_logo_url ? "Replace logo" : "Add a logo (optional)"}
        accept="image/png,image/jpeg,image/webp"
        hint="PNG, JPG or WEBP, up to 2 MB. A square image works best."
        maxBytes={2 * 1024 * 1024}
        error={state.fieldErrors?.companyLogo}
        current={
          employer?.company_logo_url ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={employer.company_logo_url}
                alt=""
                className="size-10 border border-rule bg-raised object-contain"
              />
              <p className="font-sans text-sm text-secondary">Current logo</p>
            </div>
          ) : undefined
        }
      />
    </>
  );
}
