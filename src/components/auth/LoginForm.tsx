"use client";

import { useActionState } from "react";
import { signIn, signInWithGoogle, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import {
  FieldGroup,
  FieldLabel,
  Input,
} from "@/components/ui/Field";
import { AuthDivider, AuthError, GoogleAuthButton } from "./AuthShared";

export function LoginForm({ redirect }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signIn,
    {},
  );

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <GoogleAuthButton />
      </form>

      <AuthDivider />

      <form action={formAction} className="space-y-4">
        {redirect && <input type="hidden" name="redirect" value={redirect} />}

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

        <FieldGroup>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </FieldGroup>

        <Button type="submit" variant="primary" fullWidth disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
