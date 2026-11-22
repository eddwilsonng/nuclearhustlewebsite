"use client";

import { useActionState, useEffect, useState } from "react";
import { uploadResume, type ActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { useToast } from "@/components/ui/Toast";

interface ResumeUploadProps {
  hasResume: boolean;
  currentFilename: string | null;
}

export function ResumeUpload({ hasResume, currentFilename }: ResumeUploadProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(uploadResume, {});
  const [hasFile, setHasFile] = useState(false);
  const toast = useToast();

  useEffect(() => {
    // React resets the form on success, which clears the picker; the new file
    // then shows as the one on file.
    if (state.success) toast.success(state.message ?? "Resume uploaded.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <FileDropzone
        id="resume"
        name="resume"
        label={hasResume ? "Replace your resume" : "Upload your resume"}
        accept=".pdf,.doc,.docx"
        hint="PDF or Word, up to 5 MB."
        maxBytes={5 * 1024 * 1024}
        error={state.fieldErrors?.resume ?? state.error}
        onFileChange={(file) => setHasFile(Boolean(file))}
        current={
          hasResume && currentFilename ? (
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate font-sans text-sm text-ink">
                <span className="text-secondary">On file: </span>
                {currentFilename}
              </p>
              <a
                href="/dashboard/resume"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center px-2 font-sans text-sm text-secondary underline underline-offset-2 hover:text-ink"
              >
                View
              </a>
            </div>
          ) : undefined
        }
      />
      {hasFile ? (
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? "Uploading…" : "Upload resume"}
        </Button>
      ) : null}
    </form>
  );
}
