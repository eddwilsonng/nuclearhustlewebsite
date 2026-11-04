"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
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
  /**
   * Job detail page only: finish a save the visitor started before signing up
   * (`?intent=save`, carried through signup by SaveJobModal).
   */
  completeSaveIntent?: boolean;
  className?: string;
}

export function SaveJobButton({
  jobSlug,
  jobId,
  initialSaved = false,
  isAuthenticated = false,
  showLabel = false,
  completeSaveIntent = false,
  className = "",
}: SaveJobButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initialSaved);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const intentHandled = useRef(false);

  // The server re-renders with a fresh initialSaved after a refresh (e.g. the
  // other Save button on the page saved this job); follow it.
  const [syncedInitial, setSyncedInitial] = useState(initialSaved);
  if (syncedInitial !== initialSaved) {
    setSyncedInitial(initialSaved);
    setSaved(initialSaved);
  }

  async function persist(nextSaved: boolean): Promise<boolean> {
    const res = await fetch("/api/jobs/save", {
      method: nextSaved ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobSlug, jobId }),
    });
    if (res.status === 401) {
      setOpen(true);
      return false;
    }
    if (!res.ok) return false;
    setSaved(nextSaved);
    // The Saved page lists only saved jobs, so re-read it after a change.
    if (pathname === "/dashboard/saved") router.refresh();
    return true;
  }

  useEffect(() => {
    if (!completeSaveIntent || !isAuthenticated || intentHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("intent") !== "save") return;
    intentHandled.current = true;
    params.delete("intent");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    if (initialSaved) return;
    fetch("/api/jobs/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobSlug, jobId }),
    })
      .then((res) => {
        if (!res.ok) return;
        setSaved(true);
        setNotice("Saved to your account.");
        router.refresh();
      })
      .catch(() => {});
  }, [completeSaveIntent, isAuthenticated, initialSaved, jobSlug, jobId, router]);

  async function handleClick() {
    if (!isAuthenticated) {
      setOpen(true);
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      await persist(!saved);
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
      {completeSaveIntent ? (
        <span role="status" aria-live="polite" className="sr-only">
          {notice}
        </span>
      ) : null}
      {open ? (
        <SaveJobModal
          open={open}
          onOpenChange={setOpen}
          redirectPath={`/job/${jobSlug}?intent=save`}
        />
      ) : null}
    </>
  );
}
