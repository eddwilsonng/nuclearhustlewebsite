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
}: {
  heading?: string;
  description?: string;
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
        <FieldDescription>{description}</FieldDescription>
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
