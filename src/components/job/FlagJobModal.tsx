"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FieldError, FieldGroup, FieldLabel, Textarea } from "@/components/ui/Field";

const REASONS = [
  { id: "broken_link", label: "Link is broken" },
  { id: "job_filled", label: "Job has been filled" },
  { id: "expired", label: "Listing is expired" },
  { id: "scam", label: "Looks like a scam" },
  { id: "incorrect_details", label: "Details are incorrect" },
] as const;

type ReasonId = (typeof REASONS)[number]["id"];

interface FlagJobModalProps {
  jobSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlagJobModal({
  jobSlug,
  open,
  onOpenChange,
}: FlagJobModalProps) {
  const notesId = useId();
  const [selected, setSelected] = useState<ReasonId | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit() {
    if (!selected) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/jobs/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobSlug,
          reason: selected,
          notes: notes.trim() || undefined,
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={status === "success" ? "Thanks for the report" : "Flag this listing"}
      description={
        status === "success"
          ? "We'll review this listing and take action if needed."
          : "Tell us what's wrong. We'll check it."
      }
    >
      {status === "success" ? (
        <Button onClick={() => onOpenChange(false)} variant="secondary">
          Close
        </Button>
      ) : (
        <div className="space-y-4">
          <div
            role="group"
            aria-label="Issue"
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {REASONS.map((reason) => (
              <button
                key={reason.id}
                type="button"
                aria-pressed={selected === reason.id}
                onClick={() => setSelected(reason.id)}
                className={`min-h-11 border px-3 py-2 text-left font-sans text-sm transition-colors duration-150 ${
                  selected === reason.id
                    ? "border-signal bg-signal/20 text-ink"
                    : "border-control text-secondary hover:bg-surface hover:text-ink"
                }`}
              >
                {reason.label}
              </button>
            ))}
          </div>

          <FieldGroup>
            <FieldLabel htmlFor={notesId}>Anything else? Optional</FieldLabel>
            <Textarea
              id={notesId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </FieldGroup>

          {status === "error" && (
            <FieldError>Something went wrong. Please try again.</FieldError>
          )}

          <div className="flex justify-end gap-2">
            <Button onClick={() => onOpenChange(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="primary"
              disabled={!selected || status === "submitting"}
            >
              {status === "submitting" ? "Sending…" : "Submit report"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
