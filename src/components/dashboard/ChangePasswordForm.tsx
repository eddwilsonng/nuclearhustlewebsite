"use client";

import { useActionState, useEffect } from "react";
import { changePassword, type ActionState } from "@/lib/auth/actions";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(changePassword, {});
  const toast = useToast();

  useEffect(() => {
    // React clears the fields itself once the action succeeds.
    if (state.success) toast.success(state.message ?? "Password updated.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? <FieldError>{state.error}</FieldError> : null}
      {hasPassword ? (
        <PasswordField
          id="currentPassword"
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          error={state.fieldErrors?.currentPassword}
        />
      ) : null}
      <PasswordField
        id="newPassword"
        name="password"
        label="New password"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
      />
      <PasswordField
        id="confirmNewPassword"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />
      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Saving…" : hasPassword ? "Change password" : "Add password"}
      </Button>
    </form>
  );
}
