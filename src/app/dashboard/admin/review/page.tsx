"use client";

import { useState, useEffect, useCallback } from "react";
import { StructuredDescription } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Dialog";
import { FieldError, FormStatus, TextareaField } from "@/components/ui/Field";
import { LinkButton } from "@/components/ui/LinkButton";
import { useToast } from "@/components/ui/Toast";
import {
  DashboardAlert,
  DashboardBody,
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardChrome";

interface ReviewJob {
  id: string;
  title: string;
  company_id: string;
  location: string;
  category: string;
  status: string;
  /** The original posting on the operator's careers site. */
  url?: string;
  agent_confidence?: "high" | "low";
  review_notes?: string;
  structured_description?: StructuredDescription | null;
  description?: string;
}

// Structured-description fields are usually strings, but some scraped/AI rows
// store arrays (e.g. responsibilities as a list) or other shapes. Coerce safely.
function asText(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" ? v : String(v))).join("\n");
  }
  if (typeof value === "string") return value;
  if (typeof value === "object") return "";
  return String(value);
}

function bulletsToText(value: string[] | undefined): string {
  return (value ?? []).join("\n");
}

function textToBullets(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-•*–]\s+/, "").trim())
    .filter(Boolean);
}

function plural(count: number) {
  return `${count} job${count === 1 ? "" : "s"}`;
}

/** POSTs to an admin route; returns an error message, or null when it worked. */
async function postAdmin(url: string, body: object): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.error || `The request failed (${res.status}).`;
  } catch {
    return "Couldn't reach the server. Check your connection and try again.";
  }
}

function DescriptionPreview({ sd }: { sd: StructuredDescription }) {
  const fields = [
    { label: "Good fit if", value: bulletsToText(sd.fit?.good) },
    { label: "About this role", value: asText(sd.about) },
    { label: "Responsibilities", value: asText(sd.responsibilities) },
    { label: "Qualifications", value: asText(sd.qualifications) },
    { label: "Desired", value: asText(sd.desired) },
    { label: "Location / Working conditions", value: asText(sd.location_details) },
    { label: "Pay, eligibility, and equal opportunity", value: asText(sd.notices) },
  ].filter((f) => f.value.trim());

  return (
    <dl className="space-y-4">
      {fields.map(({ label, value }) => (
        <div key={label}>
          <dt className="font-mono text-xs uppercase tracking-widest text-secondary">{label}</dt>
          <dd className="mt-1 max-w-prose whitespace-pre-line font-sans text-sm leading-relaxed text-ink">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EditableDescription({
  jobId,
  sd,
  onChange,
}: {
  jobId: string;
  sd: StructuredDescription;
  onChange: (updated: StructuredDescription) => void;
}) {
  const fields: {
    key: Exclude<
      keyof StructuredDescription,
      "fit" | "skills" | "what_we_offer"
    >;
    label: string;
  }[] = [
    { key: "about", label: "About this role" },
    { key: "responsibilities", label: "Responsibilities" },
    { key: "qualifications", label: "Qualifications" },
    { key: "desired", label: "Desired" },
    { key: "location_details", label: "Location / Working conditions" },
    { key: "notices", label: "Pay, eligibility, and equal opportunity" },
  ];

  // Keep the raw text so a new, still-empty bullet line survives typing.
  const [fitText, setFitText] = useState(() => bulletsToText(sd.fit?.good));

  function setFit(raw: string) {
    setFitText(raw);
    const bullets = textToBullets(raw);
    const fit = bullets.length === 0 ? undefined : { good: bullets };
    onChange({ ...sd, fit });
  }

  return (
    <div className="space-y-5">
      <TextareaField
        id={`${jobId}-fit`}
        label="Good fit if"
        description="One bullet per line."
        rows={4}
        value={fitText}
        onChange={(e) => setFit(e.target.value)}
      />
      {fields.map(({ key, label }) => (
        <TextareaField
          key={key}
          id={`${jobId}-${key}`}
          label={label}
          rows={4}
          value={asText(sd[key])}
          onChange={(e) => onChange({ ...sd, [key]: e.target.value })}
        />
      ))}
    </div>
  );
}

function JobCard({
  job,
  onAction,
}: {
  job: ReviewJob;
  onAction: () => Promise<void>;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editedSd, setEditedSd] = useState<StructuredDescription>(
    job.structured_description || {},
  );
  const [busy, setBusy] = useState<"approve" | "reject" | "reprocess" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(
    kind: NonNullable<typeof busy>,
    url: string,
    body: object,
    confirmation: string,
  ) {
    setBusy(kind);
    setError(null);
    const problem = await postAdmin(url, body);
    if (problem) {
      setBusy(null);
      setError(problem);
      toast.error("That didn't go through", problem);
      return;
    }
    toast.success(confirmation);
    await onAction();
    setBusy(null);
  }

  const handleApprove = () =>
    run(
      "approve",
      "/api/admin/publish-job",
      {
        jobId: job.id,
        structured_description: editing ? editedSd : job.structured_description,
      },
      `Published “${job.title}”.`,
    );

  const handleReject = () =>
    run("reject", "/api/admin/reject-job", { jobId: job.id }, `Rejected “${job.title}”.`);

  const handleReprocess = () =>
    run(
      "reprocess",
      "/api/admin/process-job",
      { jobId: job.id },
      `Re-ran the AI review for “${job.title}”.`,
    );

  const isLow = job.agent_confidence === "low";
  const working = busy !== null;
  const headingId = `review-${job.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className={cn("border bg-raised", isLow ? "border-ink" : "border-rule")}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-rule px-5 py-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {isLow && <Badge className="border-ink text-ink">Flagged · review carefully</Badge>}
            <Badge>{job.category}</Badge>
          </div>
          <h2 id={headingId} className="font-sans text-base font-semibold text-ink">
            {job.title}
          </h2>
          <p className="mt-0.5 font-sans text-sm text-secondary">
            {job.company_id} · {job.location}
          </p>
        </div>
        <Button variant="quiet" size="compact" onClick={handleReprocess} disabled={working}>
          {busy === "reprocess" ? "Running…" : "Re-run AI"}
        </Button>
      </div>

      {job.review_notes && (
        <div className="border-b border-rule bg-surface px-5 py-3">
          <p className="font-mono text-xs uppercase tracking-widest text-secondary">Agent notes</p>
          <p className="mt-1 max-w-prose font-sans text-sm leading-relaxed text-ink">{job.review_notes}</p>
        </div>
      )}

      {/* Description */}
      <div className="px-5 py-5">
        {job.structured_description ? (
          editing ? (
            <EditableDescription jobId={job.id} sd={editedSd} onChange={setEditedSd} />
          ) : (
            <DescriptionPreview sd={job.structured_description} />
          )
        ) : (
          <p className="font-sans text-sm text-secondary">
            No structured description yet. Re-run AI to process it.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-rule px-5 py-4">
        <Button size="compact" onClick={handleApprove} disabled={working}>
          {busy === "approve" ? "Publishing…" : editing ? "Approve with edits" : "Approve"}
        </Button>
        {job.structured_description && (
          <Button
            variant="quiet"
            size="compact"
            onClick={() => {
              setEditing((e) => !e);
              setEditedSd(job.structured_description || {});
            }}
            disabled={working}
          >
            {editing ? "Cancel edit" : "Edit"}
          </Button>
        )}
        <Button
          variant="quiet"
          size="compact"
          className="text-danger hover:text-danger"
          onClick={handleReject}
          disabled={working}
        >
          {busy === "reject" ? "Rejecting…" : "Reject"}
        </Button>
        {/* Pending jobs aren't on the public site yet, so check against the source. */}
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex min-h-10 items-center font-sans text-sm text-secondary underline-offset-2 hover:text-ink hover:underline"
          >
            Original posting
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {error && <FieldError className="basis-full">{error}</FieldError>}
      </div>
    </article>
  );
}

export default function ReviewQueuePage() {
  const toast = useToast();
  const [jobs, setJobs] = useState<ReviewJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [bulkKind, setBulkKind] = useState<"approve" | "reject">("approve");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/review-queue");
      if (!res.ok) throw new Error(`Review queue returned ${res.status}`);
      const data = await res.json();
      setJobs(data.jobs);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
    setLoading(false);
  }, []);

  // Fetch the queue once on mount (and after actions via load()).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const pending = jobs.filter((j) => j.status === "pending_review");
  const lowConf = pending.filter((j) => j.agent_confidence === "low");
  const highConf = pending.filter((j) => j.agent_confidence !== "low");
  const sorted = [...lowConf, ...highConf];
  const bulkJobs = bulkKind === "approve" ? highConf : lowConf;

  function askBulk(kind: "approve" | "reject") {
    setBulkKind(kind);
    setBulkError(null);
    setBulkOpen(true);
  }

  async function runBulk() {
    const ids = bulkJobs.map((j) => j.id);
    if (ids.length === 0) return;
    setBulkBusy(true);
    setBulkError(null);
    const problem = await postAdmin(
      bulkKind === "approve" ? "/api/admin/publish-jobs" : "/api/admin/reject-jobs",
      { jobIds: ids },
    );
    setBulkBusy(false);
    if (problem) {
      setBulkError(problem);
      return;
    }
    toast.success(bulkKind === "approve" ? `Published ${plural(ids.length)}.` : `Rejected ${plural(ids.length)}.`);
    setBulkOpen(false);
    await load();
  }

  return (
    <>
      <DashboardPageHeader
        title="Review queue"
        back={{ href: "/dashboard/admin", label: "Operations" }}
        description={
          loading
            ? "Loading the queue…"
            : pending.length === 0
              ? "Crawled jobs wait here for approval before they go live."
              : `${plural(pending.length)} pending${
                  lowConf.length > 0 ? ` · ${lowConf.length} flagged and shown first` : ""
                }. Scan flagged jobs before bulk-approving.`
        }
        action={
          pending.length > 0 ? (
            <>
              <Button size="compact" disabled={lowConf.length === 0} onClick={() => askBulk("reject")}>
                Reject {lowConf.length} flagged
              </Button>
              <Button
                variant="primary"
                size="compact"
                disabled={highConf.length === 0}
                onClick={() => askBulk("approve")}
              >
                Approve {highConf.length} high-confidence
              </Button>
            </>
          ) : null
        }
      />

      <DashboardBody>
        {loadError && (
          <div className="mb-6">
            <DashboardAlert tone="error">
              We couldn&apos;t load the review queue. Refresh to try again.
            </DashboardAlert>
          </div>
        )}

        {loading ? (
          <FormStatus>Loading…</FormStatus>
        ) : sorted.length === 0 ? (
          loadError ? null : (
            <DashboardEmptyState
              title="Nothing waiting for review"
              description="Run the scraper to add new jobs to the queue."
              action={
                <LinkButton href="/dashboard/admin/scrape" size="compact">
                  Open the scraper
                </LinkButton>
              }
            />
          )
        ) : (
          <div className="space-y-6">
            {sorted.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAction={load}
              />
            ))}
          </div>
        )}
      </DashboardBody>

      <Modal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={
          bulkKind === "approve"
            ? `Approve ${plural(highConf.length)}?`
            : `Reject ${plural(lowConf.length)}?`
        }
        description={
          bulkKind === "approve"
            ? "They go live on the board straight away. Flagged jobs stay in the queue."
            : "Only the flagged jobs are rejected. They leave the queue and won't go live."
        }
      >
        <div className="space-y-4">
          {bulkError && <FieldError>{bulkError}</FieldError>}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={bulkKind === "approve" ? "primary" : "danger"}
              disabled={bulkBusy || bulkJobs.length === 0}
              onClick={runBulk}
            >
              {bulkBusy
                ? bulkKind === "approve"
                  ? "Publishing…"
                  : "Rejecting…"
                : bulkKind === "approve"
                  ? `Publish ${plural(highConf.length)}`
                  : `Reject ${plural(lowConf.length)}`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
