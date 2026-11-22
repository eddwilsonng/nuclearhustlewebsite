"use client";

import { useActionState, useState } from "react";
import { signUpJobSeeker, signInWithGoogle, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { FieldError, TextField } from "@/components/ui/Field";
import { TermsAcceptance } from "@/components/legal/TermsAcceptance";
import { AuthDivider, AuthError, GoogleAuthButton } from "./AuthShared";
import { PasswordField } from "./PasswordField";

export function JobSeekerSignupForm({ redirect }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signUpJobSeeker,
    {},
  );
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="space-y-5">
      <TermsAcceptance id="seeker-terms" checked={accepted} onChange={setAccepted} />
      {state.fieldErrors?.acceptedTerms ? <FieldError>{state.fieldErrors.acceptedTerms}</FieldError> : null}

      <form action={signInWithGoogle}>
        <input type="hidden" name="acceptedTerms" value={accepted ? "on" : ""} />
        <GoogleAuthButton role="job_seeker" redirect={redirect} disabled={!accepted} />
      </form>

      <AuthDivider />

      <form action={formAction} className="space-y-5" noValidate>
        {redirect && <input type="hidden" name="redirect" value={redirect} />}
        <input type="hidden" name="acceptedTerms" value={accepted ? "on" : ""} />
        {state.error && <AuthError>{state.error}</AuthError>}

        <TextField
          id="fullName"
          label="Full name"
          type="text"
          required
          autoComplete="name"
          placeholder="Jane Doe"
          defaultValue={state.values?.fullName}
          error={state.fieldErrors?.fullName}
        />

        <TextField
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email}
        />

        <PasswordField
          autoComplete="new-password"
          description="At least 8 characters."
          error={state.fieldErrors?.password}
        />

        <Button type="submit" variant="primary" fullWidth disabled={isPending || !accepted}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
