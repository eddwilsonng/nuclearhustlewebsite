"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { toggleJobStatus, deleteJobPosting, renewJob, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { FieldError } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import {
  FEATURED_DURATION_DAYS,
  featuredPlacementSentence,
  featuredPriceLabel,
} from "@/lib/jobs/featuredOffer";

const menuItemClass =
  "flex min-h-10 w-full cursor-pointer items-center px-3 py-2 text-left font-sans text-sm text-ink no-underline outline-none data-highlighted:bg-surface data-disabled:opacity-50";

/** Starts Stripe checkout. Returns an error message, or null once redirecting. */
export async function startFeatureCheckout(jobId: string): Promise<string | null> {
  try {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, acceptedTerms: true }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.url) {
      window.location.href = data.url;
      return null;
    }
    return data.error || "Checkout couldn't start. Nothing was charged. Try again in a minute.";
  } catch {
    return "Checkout couldn't start. Check your connection and try again. Nothing was charged.";
  }
}

/** The feature-this-listing dialog, shared by the jobs list and the posted page. */
export function FeatureDialog({
  jobId,
  open,
  onOpenChange,
}: {
  jobId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setAcceptedTerms(false);
          setError(null);
        }
        onOpenChange(next);
      }}
      title="Feature this listing?"
      description={`A one-time ${featuredPriceLabel()} charge. ${featuredPlacementSentence()} Full refund if it never goes live as featured.`}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <input
            id={`feature-terms-${jobId}`}
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-ink"
          />
          <div className="font-sans text-sm leading-relaxed text-secondary">
            <label htmlFor={`feature-terms-${jobId}`} className="text-ink">
              I agree to the Terms of Service for this {FEATURED_DURATION_DAYS}-day featured listing.
            </label>{" "}
            <a href="/terms" className="text-ink underline underline-offset-2">
              Terms
            </a>
          </div>
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={isPending || !acceptedTerms}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const problem = await startFeatureCheckout(jobId);
                if (problem) setError(problem);
              });
            }}
          >
            {isPending ? "Starting checkout…" : `Pay ${featuredPriceLabel()}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function JobRowMenu({
  jobId,
  slug,
  title,
  isActive,
  featuredLive,
  canRenew,
  expired,
}: {
  jobId: string;
  slug: string;
  title: string;
  isActive: boolean;
  featuredLive: boolean;
  canRenew: boolean;
  expired: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);

  function run(action: () => Promise<ActionState>, onDone?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error("That didn't work", result.error);
        return;
      }
      if (result.message) toast.success(result.message);
      onDone?.();
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Link
          href={`/dashboard/jobs/${jobId}/edit`}
          className="inline-flex min-h-10 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
          aria-label={`Edit ${title}`}
        >
          Edit
        </Link>
        <Menu.Root>
          <Menu.Trigger
            aria-label={`More actions for ${title}`}
            className="inline-flex min-h-10 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
          >
            {isPending ? "Working…" : "More"}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} align="end" className="z-50">
              <Menu.Popup className="card-raised min-w-48 border border-control bg-raised py-1 outline-none">
                {canRenew && (
                  <Menu.Item disabled={isPending} className={menuItemClass} onClick={() => run(() => renewJob(jobId))}>
                    Renew for 60 days
                  </Menu.Item>
                )}
                {!featuredLive && !expired && isActive && (
                  <Menu.Item disabled={isPending} className={menuItemClass} onClick={() => setFeatureOpen(true)}>
                    Feature — {featuredPriceLabel()}
                  </Menu.Item>
                )}
                {!expired && (
                  <Menu.Item
                    disabled={isPending}
                    className={menuItemClass}
                    onClick={() => run(() => toggleJobStatus(jobId, !isActive))}
                  >
                    {isActive ? "Pause listing" : "Make live again"}
                  </Menu.Item>
                )}
                <Menu.Item
                  render={
                    <a href={`/job/${slug}`} target="_blank" rel="noopener noreferrer" className={menuItemClass} />
                  }
                >
                  View public listing
                </Menu.Item>
                <Menu.Item className={`${menuItemClass} text-danger`} onClick={() => setDeleteOpen(true)}>
                  Delete
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      <FeatureDialog jobId={jobId} open={featureOpen} onOpenChange={setFeatureOpen} />

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this posting?"
        description="This can't be undone. The listing comes off the board and its applications are deleted. Pausing it keeps them."
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => run(() => deleteJobPosting(jobId), () => setDeleteOpen(false))}
          >
            {isPending ? "Deleting…" : "Delete posting"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
