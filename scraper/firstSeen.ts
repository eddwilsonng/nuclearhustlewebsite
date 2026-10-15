import * as fs from "fs";
import * as path from "path";

const STORE_PATH = path.join(__dirname, "..", "src", "data", "job-first-seen.json");

type Store = Record<string, string>;

let store: Store | null = null;
let dirty = false;

function load(): Store {
  if (store) return store;
  try {
    store = JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as Store;
  } catch {
    store = {};
  }
  return store;
}

/** Keep the earliest stamp. A later scrape must not make an old role look new. */
export function rememberFirstSeen(id: string, seenAt: string): string {
  const current = load();
  const existing = current[id];
  if (!existing || seenAt < existing) {
    current[id] = seenAt;
    dirty = true;
    return seenAt;
  }
  return existing;
}

export function flushFirstSeen(): void {
  if (!dirty || !store) return;
  const ordered: Store = {};
  for (const id of Object.keys(store).sort((a, b) => {
    const delta = Number(a) - Number(b);
    if (Number.isFinite(delta) && delta !== 0) return delta;
    return a.localeCompare(b);
  })) {
    ordered[id] = store[id];
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(ordered, null, 2) + "\n");
  store = ordered;
  dirty = false;
}
