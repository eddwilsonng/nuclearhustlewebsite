"use client";

import { useState, useTransition } from "react";
import { deleteOwnAccount, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { DashboardSectionLabel } from "@/components/dashboard/DashboardChrome";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mt-10 border-t border-rule pt-8">
      <DashboardSectionLabel>Account</DashboardSectionLabel>
      <p className="mt-4 max-w-prose font-sans text-sm leading-relaxed text-secondary">
        Deleting your account removes your profile and, if you are an employer,
        your listings. Applications an employer has already received stay with
        them.
      </p>
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
        description="This is permanent. Your profile and listings come off the board."
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
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
