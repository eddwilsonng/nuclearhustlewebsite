"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const SaveJobModal = dynamic(
  () => import("./SaveJobModal").then((m) => m.SaveJobModal),
  { ssr: false },
);

interface SaveJobButtonProps {
  jobSlug: string;
  jobId: string;
  initialSaved?: boolean;
  isAuthenticated?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function SaveJobButton({
  jobSlug,
  jobId,
  initialSaved = false,
  isAuthenticated = false,
  showLabel = false,
  className = "",
}: SaveJobButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      setOpen(true);
      return;
    }

    setLoading(true);
    try {
      const method = saved ? "DELETE" : "POST";
      const res = await fetch("/api/jobs/save", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobSlug, jobId }),
      });

      if (res.status === 401) {
        setOpen(true);
        return;
      }
      if (res.ok) {
        setSaved(!saved);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={loading}
        variant={showLabel ? "secondary" : "quiet"}
        size="compact"
        aria-pressed={saved}
        aria-label={saved ? "Unsave job" : "Save job"}
        className={cn("relative z-10", className)}
      >
        <Heart
          size={16}
          aria-hidden="true"
          className={saved ? "fill-signal text-ink" : "text-secondary"}
        />
        {showLabel && (saved ? "Saved" : "Save")}
      </Button>
      {open ? (
        <SaveJobModal
          open={open}
          onOpenChange={setOpen}
          redirectPath={`/job/${jobSlug}`}
        />
      ) : null}
    </>
  );
}
