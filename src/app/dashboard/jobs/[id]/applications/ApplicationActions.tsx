"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "@/lib/auth/actions";
import { Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import type { ApplicationStatus } from "@/lib/types";

export const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

export function StatusSelect({
  applicationId,
  status,
  applicantName,
}: {
  applicationId: string;
  status: ApplicationStatus;
  applicantName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState<ApplicationStatus>(status);
  const router = useRouter();
  const toast = useToast();

  const handleChange = (next: ApplicationStatus) => {
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await updateApplicationStatus(applicationId, next);
      if (result.error) {
        setCurrent(previous);
        toast.error("Status not changed", result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Select
      value={current}
      disabled={isPending}
      aria-label={`Application status for ${applicantName}`}
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
