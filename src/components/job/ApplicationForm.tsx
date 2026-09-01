"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  FieldError,
  FieldGroup,
  FieldLabel,
  FormStatus,
  Input,
  Textarea,
} from "@/components/ui/Field";

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  defaultName?: string;
  defaultEmail?: string;
}

export function ApplicationForm({
  jobId,
  jobTitle,
  companyName,
  defaultName = "",
  defaultEmail = "",
}: ApplicationFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

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
      <div className="border border-rule p-6">
        <FormStatus>
          Application sent. {companyName} will be in touch if your profile is a
          match.
        </FormStatus>
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
