/** Keep a `redirect` value only when it is a path on this site. */
export function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

/** `path?redirect=…` when there is a safe redirect to carry, else `path`. */
export function withRedirect(path: string, redirect?: string | null): string {
  const safe = safeInternalPath(redirect);
  return safe ? `${path}?redirect=${encodeURIComponent(safe)}` : path;
}
