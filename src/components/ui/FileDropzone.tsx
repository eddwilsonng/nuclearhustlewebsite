"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FieldDescription, FieldError } from "./Field";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * File picker with a drop target. The native input stays in the form, so the
 * file submits with a server action like any other field. The chosen file and
 * its Remove control sit outside the label, so no control is nested in another.
 */
export function FileDropzone({
  id,
  name,
  label,
  accept,
  hint,
  maxBytes,
  required,
  error,
  current,
  onFileChange,
  className,
}: {
  id: string;
  name: string;
  label: ReactNode;
  accept: string;
  hint: string;
  maxBytes?: number;
  required?: boolean;
  error?: string;
  /** Something already on file, shown until a new file is chosen. */
  current?: ReactNode;
  onFileChange?: (file: File | null) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const shownError = localError ?? error;

  // React resets a form after its action succeeds; clear the chosen file too.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setFile(null);
      setLocalError(null);
      onFileChange?.(null);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [onFileChange]);

  function assign(next: File | null) {
    setLocalError(null);
    if (next && maxBytes && next.size > maxBytes) {
      setLocalError(`That file is ${formatBytes(next.size)}. The limit is ${formatBytes(maxBytes)}.`);
      next = null;
    }
    if (inputRef.current) {
      const transfer = new DataTransfer();
      if (next) transfer.items.add(next);
      inputRef.current.files = transfer.files;
    }
    setFile(next);
    onFileChange?.(next);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          assign(event.dataTransfer.files[0] ?? null);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center border border-dashed bg-surface px-4 py-6 text-center transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-focus",
          dragging ? "border-ink bg-raised" : "border-control hover:border-ink",
          shownError && "border-danger",
        )}
      >
        <span className="font-sans text-sm font-medium text-ink">{label}</span>
        <span className="mt-1 font-sans text-sm text-secondary">
          {file ? "Choose a different file" : "Drop a file here or browse"}
        </span>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          required={required}
          aria-describedby={cn(hintId, shownError && errorId)}
          aria-invalid={shownError ? true : undefined}
          onChange={(event) => assign(event.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>
      <FieldDescription id={hintId}>{hint}</FieldDescription>

      {file ? (
        <div className="flex items-center justify-between gap-3 border border-rule bg-raised px-4 py-2">
          <p className="min-w-0 truncate font-sans text-sm text-ink">
            {file.name} <span className="font-mono text-xs text-secondary">{formatBytes(file.size)}</span>
          </p>
          <button
            type="button"
            onClick={() => assign(null)}
            className="inline-flex min-h-11 shrink-0 items-center px-2 font-sans text-sm text-secondary hover:text-ink"
          >
            Remove
          </button>
        </div>
      ) : current ? (
        <div className="border border-rule bg-raised px-4 py-2">{current}</div>
      ) : null}

      {shownError ? <FieldError id={errorId}>{shownError}</FieldError> : null}
    </div>
  );
}
