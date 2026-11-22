"use client";

import { useActionState, useState } from "react";
import { chooseAccountRole, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { FieldError } from "@/components/ui/Field";
import { TermsAcceptance } from "@/components/legal/TermsAcceptance";
import { AuthError } from "./AuthShared";

type Role = "job_seeker" | "employer";

export function RoleChoiceForm({ redirect }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(chooseAccountRole, {});
  const [role, setRole] = useState<Role>("job_seeker");
  const [accepted, setAccepted] = useState(false);

  return (
    <form action={formAction} className="space-y-6">
      {redirect ? <input type="hidden" name="redirect" value={redirect} /> : null}
      <input type="hidden" name="acceptedTerms" value={accepted ? "on" : ""} />
      {state.error ? <AuthError>{state.error}</AuthError> : null}

      <ChoiceGroup<Role>
        name="role"
        label="How will you use Nuclear Hustle?"
        value={role}
        onValueChange={setRole}
        options={[
          {
            value: "job_seeker",
            label: "I'm looking for a job",
            description: "Save roles, apply with a stored resume and track your applications.",
          },
          {
            value: "employer",
            label: "I'm hiring",
            description: "Post roles for free and receive applications with CVs.",
          },
        ]}
      />
      {state.fieldErrors?.role ? <FieldError>{state.fieldErrors.role}</FieldError> : null}

      <div className="space-y-2">
        <TermsAcceptance id="onboarding-terms" checked={accepted} onChange={setAccepted} />
        {state.fieldErrors?.acceptedTerms ? <FieldError>{state.fieldErrors.acceptedTerms}</FieldError> : null}
      </div>

      <Button type="submit" variant="primary" fullWidth disabled={isPending || !accepted}>
        {isPending ? "Setting up…" : role === "employer" ? "Continue to company details" : "Continue to job matching"}
      </Button>
    </form>
  );
}
