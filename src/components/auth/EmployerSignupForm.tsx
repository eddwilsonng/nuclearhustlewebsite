"use client";

import { useActionState, useState } from "react";
import { signUpEmployer, signInWithGoogle, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { FieldError, TextField } from "@/components/ui/Field";
import { TermsAcceptance } from "@/components/legal/TermsAcceptance";
import { AuthDivider, AuthError, GoogleAuthButton } from "./AuthShared";
import { PasswordField } from "./PasswordField";

export function EmployerSignupForm({ redirect }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signUpEmployer,
    {},
  );
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="space-y-5">
      <TermsAcceptance id="employer-terms" checked={accepted} onChange={setAccepted} />
      {state.fieldErrors?.acceptedTerms ? <FieldError>{state.fieldErrors.acceptedTerms}</FieldError> : null}

      <form action={signInWithGoogle}>
        <input type="hidden" name="acceptedTerms" value={accepted ? "on" : ""} />
        <GoogleAuthButton role="employer" redirect={redirect} disabled={!accepted} />
      </form>

      <AuthDivider />

      <form action={formAction} className="space-y-5" noValidate>
        {redirect && <input type="hidden" name="redirect" value={redirect} />}
        <input type="hidden" name="acceptedTerms" value={accepted ? "on" : ""} />
        {state.error && <AuthError>{state.error}</AuthError>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            id="fullName"
            label="Your name"
            type="text"
            required
            autoComplete="name"
            placeholder="Jane Doe"
            defaultValue={state.values?.fullName}
            error={state.fieldErrors?.fullName}
          />
          <TextField
            id="email"
            label="Work email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            description="We email a 6-digit code here to confirm it."
            defaultValue={state.values?.email}
            error={state.fieldErrors?.email}
          />
        </div>

        <TextField
          id="companyName"
          label="Company name"
          type="text"
          required
          autoComplete="organization"
          placeholder="Acme Nuclear Inc."
          defaultValue={state.values?.companyName}
          error={state.fieldErrors?.companyName}
        />

        <PasswordField
          autoComplete="new-password"
          description="At least 8 characters."
          error={state.fieldErrors?.password}
        />

        <Button type="submit" variant="primary" fullWidth disabled={isPending || !accepted}>
          {isPending ? "Creating account…" : "Create employer account"}
        </Button>
      </form>
    </div>
  );
}
