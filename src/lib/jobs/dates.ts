export function getPostedLabel(
  dateString: string,
  style: "short" | "long" = "short",
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (style === "long") {
    if (diffDays === 0) return "Posted today";
    if (diffDays === 1) return "Posted yesterday";
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    return `Posted ${date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`;
  }

  if (diffDays === 0) return "Today";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
