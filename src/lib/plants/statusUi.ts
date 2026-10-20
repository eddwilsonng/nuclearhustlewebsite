import type { UnitState } from "@/lib/outages/unitState";

export type PlantStatus = UnitState;

export function plantStatusLabel(status: PlantStatus): string {
  switch (status) {
    case "full":
      return "Full power";
    case "reduced":
      return "Reduced";
    case "coastdown":
      return "Coasting down";
    case "offline":
      return "Offline";
    case "unplanned":
      return "Offline (unplanned)";
    case "maintenance":
      return "Offline for maintenance";
    case "refueling_outage":
      return "Refueling outage";
    case "extended_shutdown":
      return "Extended shutdown";
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
    case "coastdown":
      return "bg-signal";
    case "offline":
    case "unplanned":
    case "maintenance":
    case "refueling_outage":
    case "extended_shutdown":
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
    case "coastdown":
      return "text-secondary";
    case "offline":
    case "unplanned":
    case "maintenance":
    case "refueling_outage":
    case "extended_shutdown":
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
    case "coastdown":
      return "bg-signal";
    case "offline":
    case "unplanned":
    case "maintenance":
    case "refueling_outage":
    case "extended_shutdown":
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
    case "coastdown":
      return "featured";
    case "offline":
    case "unplanned":
    case "maintenance":
    case "refueling_outage":
    case "extended_shutdown":
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

export function plantMarkerFill(status: PlantStatus): string {
  switch (status) {
    case "full":
      return "var(--success)";
    case "reduced":
    case "coastdown":
      return "var(--signal)";
    case "offline":
    case "unplanned":
    case "maintenance":
    case "refueling_outage":
    case "extended_shutdown":
      return "var(--danger)";
    case "restarting":
      return "var(--ink)";
    default:
      return "var(--rule)";
  }
}
