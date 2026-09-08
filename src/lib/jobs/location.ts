import { extractState } from "../states";
import plantsData from "../../data/plants.json";

const PLANTS = (plantsData as { plants: { name: string; city: string; state: string }[] })
  .plants;

const PLACEHOLDER =
  /see posting|various .+ locations?|location not specified|not specified|^remote$/i;

export function isPlaceholderLocation(location?: string | null): boolean {
  const t = location?.trim();
  if (!t) return true;
  return PLACEHOLDER.test(t);
}

/** `/baxley-ga/` career-site paths → "Baxley, GA". */
export function locationFromCareersUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const decoded = decodeURIComponent(url);
  if (/hancocks?-?(?:'|\&apos;)?s?-?bridge/i.test(decoded)) {
    return "Hancock's Bridge, NJ";
  }
  if (/south-plainfield/i.test(decoded)) return "South Plainfield, NJ";
  if (/\/job\/Salem-/i.test(decoded)) return "Salem, NJ";
  if (/\/job\/Newark-/i.test(decoded)) return "Newark, NJ";
  try {
    const path = new URL(url).pathname;
    const m = path.match(/\/([a-z0-9-]+)-([a-z]{2})(?:\/|$)/i);
    if (!m) return undefined;
    const city = m[1]
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `${city}, ${m[2].toUpperCase()}`;
  } catch {
    return undefined;
  }
}

function plantFromTitle(title?: string) {
  if (!title) return undefined;
  const sorted = [...PLANTS].sort((a, b) => b.name.length - a.name.length);
  return sorted.find((p) =>
    new RegExp(`\\b${p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      title,
    ),
  );
}

/** Real city/state for display and fit. Never "See posting for location". */
export function resolveJobLocation(input: {
  location?: string;
  url?: string;
  title?: string;
}): { location: string; state: string | null } | undefined {
  if (!isPlaceholderLocation(input.location) && input.location) {
    return {
      location: input.location.trim(),
      state: extractState(input.location),
    };
  }

  const fromUrl = locationFromCareersUrl(input.url);
  if (fromUrl) {
    return { location: fromUrl, state: extractState(fromUrl) };
  }

  const plant = plantFromTitle(input.title);
  if (plant?.city && plant.state) {
    const location = `${plant.city}, ${plant.state}`;
    return { location, state: extractState(location) };
  }

  return undefined;
}
