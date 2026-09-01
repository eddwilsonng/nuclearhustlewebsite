export type PlantStatus =
  | "full"
  | "reduced"
  | "offline"
  | "unknown"
  | "restarting";

export function plantStatusLabel(status: PlantStatus): string {
  switch (status) {
    case "full":
      return "Full power";
    case "reduced":
      return "Reduced";
    case "offline":
      return "Offline";
    case "restarting":
      return "Restarting";
    default:
      return "No data";
  }
}

export function plantStatusDotClass(status: PlantStatus): string {
  switch (status) {
    case "full":
      return "bg-success";
    case "reduced":
      return "bg-signal";
    case "offline":
      return "bg-danger";
    case "restarting":
      return "bg-ink";
    default:
      return "bg-rule";
  }
}

export function plantStatusTextClass(status: PlantStatus): string {
  switch (status) {
    case "full":
      return "text-success";
    case "reduced":
      return "text-secondary";
    case "offline":
      return "text-danger";
    case "restarting":
      return "text-ink";
    default:
      return "text-secondary";
  }
}

export function plantStatusBarClass(status: PlantStatus): string {
  switch (status) {
    case "full":
      return "bg-success";
    case "reduced":
      return "bg-signal";
    case "offline":
      return "bg-danger";
    case "restarting":
      return "bg-ink";
    default:
      return "bg-rule";
  }
}

export function plantStatusBadgeTone(
  status: PlantStatus,
): "success" | "featured" | "danger" | "neutral" {
  switch (status) {
    case "full":
      return "success";
    case "reduced":
      return "featured";
    case "offline":
      return "danger";
    default:
      return "neutral";
  }
}

export function unitPowerChipClass(power: number | null): string {
  if (power === null) return "border-rule text-secondary";
  if (power === 0) return "border-danger bg-danger-surface text-danger";
  if (power >= 95) return "border-success bg-success-surface text-success";
  return "border-rule bg-surface text-secondary";
}

export function plantMarkerFill(
  status: PlantStatus,
  avgPower: number | null,
): string {
  if (status === "restarting") return "var(--ink)";
  if (status === "unknown" || avgPower === null) return "var(--rule)";
  if (avgPower === 0) return "var(--danger)";
  if (avgPower >= 95) return "var(--success)";
  return "var(--signal)";
}
