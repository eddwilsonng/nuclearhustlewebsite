"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import { toggleJobStatus, deleteJobPosting, renewJob } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";

const menuItemClass =
  "flex w-full cursor-pointer items-center px-3 py-2 text-left font-sans text-sm text-ink outline-none data-highlighted:bg-surface data-disabled:opacity-50";

async function startFeatureCheckout(jobId: string) {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  });
  const data = await response.json();
  if (data.url) {
    window.location.href = data.url;
    return true;
  }
  return false;
}

export function JobRowMenu({
  jobId,
  slug,
  isActive,
  isFeatured,
  featuredUntil,
  expired,
}: {
  jobId: string;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
  featuredUntil: string | null;
  expired: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const featuredLive =
    isFeatured && featuredUntil && new Date(featuredUntil) > new Date();

  return (
    <>
      <Menu.Root>
        <Menu.Trigger
          aria-label="Job actions"
          className="inline-flex min-h-9 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
        >
          More
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="end" className="z-50">
            <Menu.Popup className="card-raised min-w-44 border border-control bg-raised py-1 outline-none">
              {expired && (
                <Menu.Item
                  disabled={isPending}
                  className={menuItemClass}
                  onClick={() => {
                    startTransition(async () => {
                      await renewJob(jobId);
                      router.refresh();
                    });
                  }}
                >
                  Renew 60 days
                </Menu.Item>
              )}
              {!featuredLive && (
                <Menu.Item
                  disabled={isPending}
                  className={menuItemClass}
                  onClick={() => {
                    startTransition(async () => {
                      await startFeatureCheckout(jobId);
                    });
                  }}
                >
                  Feature — $99
                </Menu.Item>
              )}
              <Menu.Item
                disabled={isPending}
                className={menuItemClass}
                onClick={() => {
                  startTransition(async () => {
                    await toggleJobStatus(jobId, !isActive);
                    router.refresh();
                  });
                }}
              >
                {isActive ? "Deactivate" : "Activate"}
              </Menu.Item>
              <Menu.Item
                render={
                  <a
                    href={`/job/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${menuItemClass} no-underline`}
                  />
                }
              >
                View listing
              </Menu.Item>
              <Menu.Item
                className={`${menuItemClass} text-danger`}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Modal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this posting?"
        description="This cannot be undone. The listing will be removed from the board."
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteJobPosting(jobId);
                setDeleteOpen(false);
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
