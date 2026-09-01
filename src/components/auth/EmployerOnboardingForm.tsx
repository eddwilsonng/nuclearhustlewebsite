"use client";

import { useActionState } from "react";
import { completeGoogleEmployerProfile, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { FieldGroup, FieldLabel, Input, Textarea } from "@/components/ui/Field";
import { AuthError } from "./AuthShared";

export function EmployerOnboardingForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    completeGoogleEmployerProfile,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <AuthError>{state.error}</AuthError>}

      <FieldGroup>
        <FieldLabel htmlFor="companyName">Company name</FieldLabel>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          required
          placeholder="Acme Nuclear Inc."
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="companyWebsite">
          Company website{" "}
          <span className="font-normal text-secondary">(optional)</span>
        </FieldLabel>
        <Input
          id="companyWebsite"
          name="companyWebsite"
          type="url"
          placeholder="https://company.com"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="companyDescription">
          Company description{" "}
          <span className="font-normal text-secondary">(optional)</span>
        </FieldLabel>
        <Textarea
          id="companyDescription"
          name="companyDescription"
          rows={3}
          placeholder="Brief description of your company…"
        />
      </FieldGroup>

      <Button type="submit" variant="primary" fullWidth disabled={isPending}>
        {isPending ? "Saving…" : "Complete setup"}
      </Button>
    </form>
  );
}
