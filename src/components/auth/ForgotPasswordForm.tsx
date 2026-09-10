"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { FieldGroup, FieldLabel, FormStatus, Input } from "@/components/ui/Field";
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
          and spam folder.
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
    <form action={formAction} className="space-y-4">
      {state.error && <AuthError>{state.error}</AuthError>}

      <FieldGroup>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </FieldGroup>

      <Button type="submit" variant="primary" fullWidth disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
