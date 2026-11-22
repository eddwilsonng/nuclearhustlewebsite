"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  changeVerificationEmail,
  resendVerificationCode,
  verifyEmployerEmail,
  type ActionState,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { CodeField } from "@/components/ui/CodeField";
import { FieldError, FormStatus, TextField } from "@/components/ui/Field";

/**
 * Enter the emailed code, ask for a new one, or fix a mistyped address.
 * `inline` is the panel shown on the new-job page: it stays put on success and
 * refreshes the page so the publish button appears.
 */
export function VerifyEmailForm({
  email,
  redirect,
  inline = false,
  hasSentCode,
}: {
  email: string;
  redirect?: string;
  inline?: boolean;
  hasSentCode: boolean;
}) {
  const router = useRouter();
  const [verifyState, verifyAction, verifying] = useActionState<ActionState, FormData>(verifyEmployerEmail, {});
  const [resendState, resendAction, resending] = useActionState<ActionState, FormData>(resendVerificationCode, {});
  const [changeState, changeAction, changing] = useActionState<ActionState, FormData>(changeVerificationEmail, {});

  useEffect(() => {
    if (inline && verifyState.success) router.refresh();
  }, [inline, verifyState.success, router]);

  useEffect(() => {
    if (changeState.success) router.refresh();
  }, [changeState.success, router]);

  if (inline && verifyState.success) {
    return <FormStatus className="text-ink">{verifyState.message}</FormStatus>;
  }

  return (
    <div className="space-y-6">
      <form action={verifyAction} className="space-y-4">
        {redirect ? <input type="hidden" name="redirect" value={redirect} /> : null}
        {inline ? <input type="hidden" name="inline" value="1" /> : null}
        <CodeField
          id="verification-code"
          name="code"
          label="Verification code"
          description={`Sent to ${email}. It expires 10 minutes after it was sent.`}
          error={verifyState.fieldErrors?.code}
          autoSubmit
          disabled={verifying}
        />
        <Button type="submit" variant="primary" disabled={verifying} fullWidth={!inline}>
          {verifying ? "Checking…" : "Confirm email"}
        </Button>
      </form>

      <div className="space-y-3 border-t border-rule pt-5">
        <form action={resendAction} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="font-sans text-sm text-secondary">
            {hasSentCode ? "No email after a minute? Check spam first." : "We haven't sent a code yet."}
          </p>
          <Button type="submit" variant="secondary" size="compact" disabled={resending}>
            {resending ? "Sending…" : hasSentCode ? "Send a new code" : "Send a code"}
          </Button>
        </form>
        {resendState.message ? <FormStatus>{resendState.message}</FormStatus> : null}
        {resendState.error ? <FieldError>{resendState.error}</FieldError> : null}

        <details className="group">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink">
            Wrong email address?
          </summary>
          <form action={changeAction} className="mt-3 space-y-3" noValidate>
            <TextField
              id="newEmail"
              label="Work email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              defaultValue={changeState.values?.newEmail}
              error={changeState.fieldErrors?.newEmail}
              description="We'll update your login and send a new code there."
            />
            <Button type="submit" variant="secondary" size="compact" disabled={changing}>
              {changing ? "Updating…" : "Send code to this address"}
            </Button>
            {changeState.message ? <FormStatus>{changeState.message}</FormStatus> : null}
            {changeState.error ? <FieldError>{changeState.error}</FieldError> : null}
          </form>
        </details>
      </div>
    </div>
  );
}
