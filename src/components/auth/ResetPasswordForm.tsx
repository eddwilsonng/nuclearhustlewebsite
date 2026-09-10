"use client";

import { useActionState } from "react";
import { updatePassword, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "./PasswordField";
import { AuthError } from "./AuthShared";

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <AuthError>{state.error}</AuthError>}

      <PasswordField
        id="password"
        name="password"
        label="New password"
        autoComplete="new-password"
        description="Minimum 8 characters."
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
      />

      <Button type="submit" variant="primary" fullWidth disabled={isPending}>
        {isPending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
