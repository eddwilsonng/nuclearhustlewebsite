import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Later classes win over conflicting earlier ones, so a `className` override on
// a cva primitive (`min-h-10` over the base `min-h-11`) actually takes effect.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
