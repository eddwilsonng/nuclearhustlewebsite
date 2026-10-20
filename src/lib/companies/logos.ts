const LOGO_IDS = new Set([
  "aep",
  "ameren",
  "aps",
  "constellation",
  "dominion",
  "dte",
  "duke",
  "entergy",
  "kairos-power",
  "nextera",
  "nppd",
  "oklo",
  "pge",
  "pseg",
  "southern-nuclear",
  "talen",
  "terrapower",
  "tva",
  "urenco-usa",
  "vistra",
  "westinghouse",
  "xcel",
]);

/** Uploaded employer mark, otherwise a static operator logo. */
export function companyLogoSrc(company: {
  id: string;
  logo_url?: string | null;
}): string | null {
  if (company.logo_url) return company.logo_url;
  if (LOGO_IDS.has(company.id)) return `/company-logos/${company.id}.png`;
  return null;
}

export function companyInitials(name: string): string {
  const words = name
    .replace(/\([^)]*\)/g, " ")
    .split(/[^A-Za-z0-9&]+/)
    .filter(Boolean);
  if (words.length === 0) return "•";
  if (words[0].length <= 4 && words[0] === words[0].toUpperCase()) return words[0];
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
