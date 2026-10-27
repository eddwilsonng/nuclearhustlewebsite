"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FormStatus,
  Input,
} from "@/components/ui/Field";

export function JobAlertForm({
  heading = "Get new jobs by email",
  description = "A Monday digest of nuclear roles. No spam.",
  layout = "stacked",
}: {
  heading?: string;
  description?: string;
  layout?: "stacked" | "bar";
}) {
  const inputId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (layout === "bar") {
    return (
      <section className="inverse-bar border-b border-white/10 bg-inverse">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          {submitted ? (
            <p
              role="status"
              aria-live="polite"
              className="font-sans text-sm text-inverse-ink"
            >
              You&apos;re on the Monday list.{" "}
              <Link
                href="/signup"
                className="underline underline-offset-2"
              >
                Create a free account
              </Link>{" "}
              to save jobs.
            </p>
          ) : (
            <BarForm
              inputId={inputId}
              errorId={errorId}
              email={email}
              error={error}
              loading={loading}
              onEmailChange={setEmail}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <FormStatus>
        You&apos;re on the Monday list.{" "}
        <Link
          href="/signup"
          className="font-medium text-ink underline underline-offset-2"
        >
          Create a free account
        </Link>{" "}
        to save jobs.
      </FormStatus>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      <FieldGroup>
        <FieldLabel htmlFor={inputId}>{heading}</FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            id={inputId}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            disabled={loading}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="sm:flex-1"
          />
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving…" : "Get alerts"}
          </Button>
        </div>
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </FieldGroup>
    </form>
  );
}

function BarForm({
  inputId,
  errorId,
  email,
  error,
  loading,
  onEmailChange,
  onSubmit,
}: {
  inputId: string;
  errorId: string;
  email: string;
  error: string;
  loading: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center lg:justify-between"
    >
      <p className="font-sans text-sm text-inverse-ink sm:text-base">
        I want a weekly email of new nuclear jobs
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor={inputId} className="sr-only">
            Email address
          </label>
          <Input
            id={inputId}
            type="email"
            required
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            disabled={loading}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="sm:w-64"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Saving…" : "Get the Monday list"}
          </Button>
        </div>
        {error && (
          <p id={errorId} role="alert" className="font-sans text-sm text-inverse-ink">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
