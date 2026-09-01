"use client";

import Link from "next/link";
import { Modal } from "@/components/ui/Dialog";
import { LinkButton } from "@/components/ui/LinkButton";

interface SaveJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectPath?: string;
}

export function SaveJobModal({
  open,
  onOpenChange,
  redirectPath,
}: SaveJobModalProps) {
  const signupHref = redirectPath
    ? `/signup/job-seeker?redirect=${encodeURIComponent(redirectPath)}`
    : "/signup/job-seeker";
  const loginHref = redirectPath
    ? `/login?redirect=${encodeURIComponent(redirectPath)}`
    : "/login";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Save this job"
      description="Create a free account to keep roles and come back to them later."
    >
      <div className="flex flex-col gap-2">
        <LinkButton href={signupHref} variant="primary" fullWidth>
          Create free account
        </LinkButton>
        <LinkButton href={loginHref} variant="secondary" fullWidth>
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
