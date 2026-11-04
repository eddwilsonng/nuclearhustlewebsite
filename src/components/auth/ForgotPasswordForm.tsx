"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { FormStatus, TextField } from "@/components/ui/Field";
import { AuthError } from "./AuthShared";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.success) {
    return (
      <div className="space-y-6">
        <FormStatus>
          If an account exists for that email, we sent a reset link. Check your inbox
          and spam folder. The link works in this browser.
        </FormStatus>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-sans text-sm font-semibold text-ink underline underline-offset-2"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <AuthError>{state.error}</AuthError>}

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

      <Button type="submit" variant="primary" fullWidth disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
