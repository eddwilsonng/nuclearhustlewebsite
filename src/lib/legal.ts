export const LEGAL_BRAND = "Nuclear Hustle";
export const LEGAL_EMAIL = "nuclearhustle@gmail.com";
export const LEGAL_SITE = "https://www.nuclearhustle.com";

/**
 * Choice of law for the terms. The operator is treated as established in
 * England and Wales. Override with NEXT_PUBLIC_LEGAL_GOVERNING_LAW if that
 * is not the operator's residence.
 */
export const LEGAL_GOVERNING_LAW =
  process.env.NEXT_PUBLIC_LEGAL_GOVERNING_LAW?.trim() || "England and Wales";

export const LEGAL_VENUE =
  process.env.NEXT_PUBLIC_LEGAL_VENUE?.trim() ||
  "the courts of England and Wales";

export function legalOperatorName(): string {
  return process.env.NEXT_PUBLIC_LEGAL_OPERATOR_NAME?.trim() || LEGAL_BRAND;
}

/**
 * Physical postal address required on commercial email (CAN-SPAM).
 * Set NEXT_PUBLIC_LEGAL_POSTAL_ADDRESS. Use \n between lines.
 */
export function legalPostalAddress(): string {
  return (process.env.NEXT_PUBLIC_LEGAL_POSTAL_ADDRESS ?? "")
    .replace(/\\n/g, "\n")
    .trim();
}

export function legalPostalLines(): string[] {
  return legalPostalAddress()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function legalSenderLines(): string[] {
  return [legalOperatorName(), ...legalPostalLines(), LEGAL_EMAIL];
}
