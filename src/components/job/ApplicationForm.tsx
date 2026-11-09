"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import {
  FieldError,
  FieldGroup,
  FieldLabel,
  FormStatus,
  Input,
  Textarea,
} from "@/components/ui/Field";
import { withRedirect } from "@/lib/redirects";

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  defaultName?: string;
  defaultEmail?: string;
  /** Signed in: the application is linked to the account. */
  signedIn?: boolean;
  /** File name of the resume stored on the seeker's profile, if any. */
  storedResumeName?: string | null;
}

type CvSource = "stored" | "upload";

export function ApplicationForm({
  jobId,
  jobTitle,
  companyName,
  defaultName = "",
  defaultEmail = "",
  signedIn = false,
  storedResumeName = null,
}: ApplicationFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [cvSource, setCvSource] = useState<CvSource>(storedResumeName ? "stored" : "upload");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("jobId", jobId);

    try {
      const res = await fetch("/api/apply", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      } else {
        setStatus("success");
        form.reset();
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="space-y-3 border border-rule p-6">
        <FormStatus className="text-ink">
          Application sent. {companyName} has it, along with your CV, and will reply by
          email if it&apos;s a match. We&apos;ve emailed you a copy.
        </FormStatus>
        {signedIn ? (
          <Link
            href="/dashboard/applications"
            className="inline-flex min-h-11 items-center font-sans text-sm font-medium text-ink underline underline-offset-2"
          >
            See it in My applications
          </Link>
        ) : (
          <p className="font-sans text-sm leading-relaxed text-secondary">
            Applying to more roles?{" "}
            <Link
              href={withRedirect("/signup/job-seeker", "/dashboard/applications")}
              className="font-medium text-ink underline underline-offset-2"
            >
              Create a free account
            </Link>{" "}
            to store your resume and keep a record of each application.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 border border-rule p-6">
      {errorMessage && <FieldError>{errorMessage}</FieldError>}

      <FieldGroup>
        <FieldLabel htmlFor="applicantName">Full name</FieldLabel>
        <Input
          id="applicantName"
          name="applicantName"
          type="text"
          required
          defaultValue={defaultName}
          autoComplete="name"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="applicantEmail">Email</FieldLabel>
        <Input
          id="applicantEmail"
          name="applicantEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          autoComplete="email"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="message">Cover letter, optional</FieldLabel>
        <Textarea id="message" name="message" rows={4} />
      </FieldGroup>

      {storedResumeName ? (
        <ChoiceGroup<CvSource>
          name="cvSource"
          label="CV / resume"
          value={cvSource}
          onValueChange={setCvSource}
          options={[
            { value: "stored", label: "Use my stored resume", description: storedResumeName },
            { value: "upload", label: "Upload a different file", description: "PDF or Word, max 5MB" },
          ]}
        />
      ) : null}

      {cvSource === "upload" ? (
        <FieldGroup>
          <FieldLabel htmlFor="cv">CV / resume, PDF or Word, max 5MB</FieldLabel>
          <Input
            id="cv"
            name="cv"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            className="py-2"
          />
        </FieldGroup>
      ) : null}

      <div className="flex items-start gap-3">
        <input
          id="acceptedTerms"
          name="acceptedTerms"
          type="checkbox"
          required
          className="mt-1 size-4 shrink-0 accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        />
        <div className="font-sans text-sm leading-relaxed text-secondary">
          <label htmlFor="acceptedTerms" className="text-ink">
            I agree to the Terms of Service and to Nuclear Hustle sending this
            application to {companyName}.
          </label>{" "}
          <a href="/terms" className="text-ink underline underline-offset-2">
            Terms
          </a>
          {" · "}
          <a href="/privacy" className="text-ink underline underline-offset-2">
            Privacy
          </a>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : `Apply for ${jobTitle}`}
      </Button>
    </form>
  );
}
