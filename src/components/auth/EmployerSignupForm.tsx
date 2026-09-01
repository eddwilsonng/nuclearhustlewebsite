"use client";

import { useActionState } from "react";
import { signUpEmployer, signInWithGoogle, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import {
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from "@/components/ui/Field";
import { AuthDivider, AuthError, GoogleAuthButton } from "./AuthShared";

export function EmployerSignupForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signUpEmployer,
    {},
  );

  return (
    <div className="space-y-5">
      <form action={signInWithGoogle}>
        <GoogleAuthButton role="employer" />
      </form>

      <AuthDivider />

      <form action={formAction} className="space-y-5">
        {state.error && <AuthError>{state.error}</AuthError>}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FieldGroup>
            <FieldLabel htmlFor="fullName">Your name</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Doe"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="email">Work email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
          </FieldGroup>
        </div>

        <FieldGroup>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <FieldDescription>Minimum 8 characters.</FieldDescription>
        </FieldGroup>

        <div className="h-px bg-rule" />
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">
          Company details
        </p>

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
            Website <span className="font-normal text-secondary">(optional)</span>
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
          {isPending ? "Creating account…" : "Create employer account"}
        </Button>
      </form>
    </div>
  );
}
