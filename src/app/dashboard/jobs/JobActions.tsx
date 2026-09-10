"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toggleJobStatus, deleteJobPosting, renewJob } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Dialog";

export function RenewJobButton({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="primary"
      size="compact"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await renewJob(jobId);
          router.refresh();
        });
      }}
    >
      {isPending ? "Renewing…" : "Renew 60 days"}
    </Button>
  );
}

export function JobStatusToggle({ jobId, isActive }: { jobId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="quiet"
      size="compact"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleJobStatus(jobId, !isActive);
          router.refresh();
        });
      }}
    >
      {isPending ? "…" : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}

export function FeatureJobButton({
  jobId,
  isFeatured,
  featuredUntil,
}: {
  jobId: string;
  isFeatured: boolean;
  featuredUntil: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const isCurrentlyFeatured =
    isFeatured && featuredUntil && new Date(featuredUntil) > new Date();

  const handleFeature = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  };

  if (isCurrentlyFeatured && featuredUntil) {
    return (
      <Badge tone="featured">
        Featured until {new Date(featuredUntil).toLocaleDateString()}
      </Badge>
    );
  }

  return (
    <Button variant="primary" size="compact" disabled={isLoading} onClick={handleFeature}>
      {isLoading ? "…" : "Feature — $99"}
    </Button>
  );
}

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <Button variant="quiet" size="compact" className="text-danger hover:text-danger" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Delete this posting?"
        description="This cannot be undone. The listing will be removed from the board."
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
                await deleteJobPosting(jobId);
                setOpen(false);
                router.refresh();
              });
            }}
          >
            {isPending ? "Deleting…" : "Delete posting"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
