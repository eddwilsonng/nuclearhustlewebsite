"use client";

import { useActionState, useState, useTransition, useRef } from "react";
import { getResumeViewUrl, uploadResume, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { FieldDescription, FieldError, FormStatus } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

interface ResumeUploadProps {
  hasResume: boolean;
  currentFilename: string | null;
}

export function ResumeUpload({ hasResume, currentFilename }: ResumeUploadProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    uploadResume,
    {},
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [viewPending, startView] = useTransition();
  const [viewError, setViewError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleView = () => {
    setViewError(null);
    startView(async () => {
      const result = await getResumeViewUrl();
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        setViewError(result.error ?? "Could not open resume");
      }
    });
  };

  const assignFile = (file: File | undefined) => {
    if (!file || !inputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    inputRef.current.files = dt.files;
    setFileName(file.name);
  };

  return (
    <div className="space-y-4">
      {hasResume && currentFilename && (
        <div className="flex items-center justify-between gap-3 border border-rule bg-surface px-4 py-3">
          <p className="min-w-0 truncate font-sans text-sm text-ink">{currentFilename}</p>
          <Button variant="quiet" size="compact" disabled={viewPending} onClick={handleView}>
            {viewPending ? "Opening…" : "View"}
          </Button>
        </div>
      )}
      {viewError && <FieldError>{viewError}</FieldError>}

      <form action={formAction}>
        <label
          htmlFor="resume"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            assignFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center border border-dashed bg-surface px-4 py-8 text-center transition-colors duration-150",
            dragging ? "border-ink" : "border-control hover:border-ink",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            name="resume"
            id="resume"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
            className="sr-only"
          />
          <p className="font-sans text-sm font-medium text-ink">
            {fileName || "Drop a file or click to upload"}
          </p>
          <FieldDescription className="mt-1">PDF or Word, max 5MB</FieldDescription>
        </label>

        {fileName && (
          <Button type="submit" variant="primary" className="mt-4" disabled={isPending}>
            {isPending ? "Uploading…" : "Upload resume"}
          </Button>
        )}
      </form>

      {state.error && <FieldError>{state.error}</FieldError>}
      {state.success && <FormStatus>Resume uploaded.</FormStatus>}
    </div>
  );
}
