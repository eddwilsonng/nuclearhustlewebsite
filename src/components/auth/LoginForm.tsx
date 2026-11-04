"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signInWithGoogle, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { AuthDivider, AuthError, GoogleAuthButton } from "./AuthShared";
import { PasswordField } from "./PasswordField";

export function LoginForm({ redirect }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signIn,
    {},
  );

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <GoogleAuthButton redirect={redirect} />
      </form>

      <AuthDivider />

      <form action={formAction} className="space-y-4" noValidate>
        {redirect && <input type="hidden" name="redirect" value={redirect} />}

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

        <div className="space-y-2">
          <PasswordField autoComplete="current-password" error={state.fieldErrors?.password} />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isPending}>
          {isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}
