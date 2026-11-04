import type { ZodError } from "zod";

/** First error message per field, keyed by the field's form name. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * Echo submitted text values back to the form. React 19 resets uncontrolled
 * forms after an action runs, so without this a failed submit wipes what the
 * user typed. Passwords and files are never echoed.
 */
export function formValues(formData: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
