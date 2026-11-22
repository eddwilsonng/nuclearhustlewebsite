"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Dialog";
import { LinkButton } from "@/components/ui/LinkButton";
import { withRedirect } from "@/lib/redirects";

interface SaveJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where to land after signing up or logging in, e.g. `/job/x?intent=save`. */
  redirectPath?: string;
}

export function SaveJobModal({
  open,
  onOpenChange,
  redirectPath,
}: SaveJobModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Save this job"
      description="Create a free account and we'll save this role for you, then bring you back to it."
    >
      <div className="flex flex-col gap-2">
        <LinkButton href={withRedirect("/signup/job-seeker", redirectPath)} variant="primary" fullWidth>
          Create free account
        </LinkButton>
        <LinkButton href={withRedirect("/login", redirectPath)} variant="secondary" fullWidth>
          Log in
        </LinkButton>
        <p className="pt-1 text-center font-sans text-sm text-secondary">
          Or{" "}
          <Link href="/jobs" className="text-ink underline underline-offset-2">
            keep browsing
          </Link>
          .
        </p>
      </div>
    </Modal>
  );
}
