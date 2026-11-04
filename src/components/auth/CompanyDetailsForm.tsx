"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveCompanyDetails, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { CompanyFields } from "@/components/dashboard/CompanyFields";
import type { EmployerProfile } from "@/lib/types";
import { AuthError } from "./AuthShared";

export function CompanyDetailsForm({
  employer,
  redirect,
  skipHref,
}: {
  employer: EmployerProfile | null;
  redirect: string;
  /** Only offered once a company name exists. */
  skipHref?: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(saveCompanyDetails, {});

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="redirect" value={redirect} />
      {state.error ? <AuthError>{state.error}</AuthError> : null}

      <CompanyFields employer={employer} state={state} />

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        {skipHref ? (
          <Link
            href={skipHref}
            className="inline-flex min-h-11 items-center justify-center font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink"
          >
            Skip for now
          </Link>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}
