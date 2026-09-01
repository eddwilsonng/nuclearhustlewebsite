"use client";

import { useActionState } from "react";
import { signUpJobSeeker, signInWithGoogle, type ActionState } from "@/lib/auth/actions";
import { US_STATES } from "@/lib/states";
import { Button } from "@/components/ui/Button";
import {
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
} from "@/components/ui/Field";
import { AuthDivider, AuthError, GoogleAuthButton } from "./AuthShared";

export function JobSeekerSignupForm({ redirect }: { redirect?: string }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signUpJobSeeker,
    {},
  );

  return (
    <div className="space-y-5">
      <form action={signInWithGoogle}>
        <GoogleAuthButton role="job_seeker" />
      </form>

      <AuthDivider />

      <form action={formAction} className="space-y-5">
        {redirect && <input type="hidden" name="redirect" value={redirect} />}
        {state.error && <AuthError>{state.error}</AuthError>}

        <FieldGroup>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
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
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <FieldDescription>Minimum 8 characters.</FieldDescription>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup>
            <FieldLabel htmlFor="location">
              City <span className="font-normal text-secondary">(optional)</span>
            </FieldLabel>
            <Input
              id="location"
              name="location"
              type="text"
              autoComplete="address-level2"
              placeholder="Chicago"
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel htmlFor="state">
              State <span className="font-normal text-secondary">(optional)</span>
            </FieldLabel>
            <Select id="state" name="state" defaultValue="">
              <option value="">Select a state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
        </div>

        <Button type="submit" variant="primary" fullWidth disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
