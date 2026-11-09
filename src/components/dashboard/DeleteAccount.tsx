"use client";

import { useState, useTransition } from "react";
import { deleteOwnAccount, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";

const CONSEQUENCES = {
  job_seeker:
    "Deleting your account removes your profile, stored resume, saved jobs and application history, and stops the Monday email. Employers keep the applications you already sent them.",
  employer:
    "Deleting your account removes your company profile and every listing, and permanently deletes the applications and CVs candidates sent you. Download anything you need first.",
} as const;

export function DeleteAccount({ role }: { role: keyof typeof CONSEQUENCES }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <p className="max-w-prose font-sans text-sm leading-relaxed text-secondary">{CONSEQUENCES[role]}</p>
      {error ? (
        <p role="alert" className="mt-3 font-sans text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="danger"
        size="compact"
        className="mt-4"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Delete account
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Delete your account?"
        description={`This can't be undone. ${CONSEQUENCES[role]}`}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Keep my account
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result: ActionState = await deleteOwnAccount();
                if (result?.error) {
                  setError(result.error);
                  setOpen(false);
                }
              });
            }}
          >
            {isPending ? "Deleting…" : "Delete account"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
