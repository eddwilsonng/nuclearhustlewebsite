"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function RemoveSavedButton({ jobSlug, jobId }: { jobSlug: string; jobId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          setFailed(false);
          const res = await fetch("/api/jobs/save", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobSlug, jobId }),
          });
          if (!res.ok) {
            setFailed(true);
            toast.error("Couldn't remove that job", "Refresh the page and try again.");
            return;
          }
          router.refresh();
        })
      }
      className="inline-flex min-h-11 shrink-0 items-center px-2 font-sans text-sm text-secondary hover:text-ink disabled:opacity-50"
      aria-label={`Remove ${jobSlug} from saved jobs`}
    >
      {isPending ? "Removing…" : failed ? "Try again" : "Remove"}
    </button>
  );
}
