"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getApplicationCvUrl, updateApplicationStatus } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import type { ApplicationStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

export function StatusSelect({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState<ApplicationStatus>(status);
  const router = useRouter();

  const handleChange = (next: ApplicationStatus) => {
    setCurrent(next);
    startTransition(async () => {
      await updateApplicationStatus(applicationId, next);
      router.refresh();
    });
  };

  return (
    <Select
      value={current}
      disabled={isPending}
      aria-label="Application status"
      onChange={(e) => handleChange(e.target.value as ApplicationStatus)}
      className="w-auto min-w-36"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}

export function DownloadCvButton({
  applicationId,
  hasCv,
}: {
  applicationId: string;
  hasCv: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!hasCv) {
    return <span className="font-mono text-xs text-secondary">No CV</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="secondary"
        size="compact"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await getApplicationCvUrl(applicationId);
            if (result.url) {
              window.open(result.url, "_blank", "noopener,noreferrer");
            } else {
              setError(result.error ?? "Could not open CV");
            }
          });
        }}
      >
        {isPending ? "Opening…" : "Download CV"}
      </Button>
      {error && (
        <span className="font-sans text-sm text-danger" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
