import axios from "axios";

/** User agents the crawler may send. robots.txt is checked for `*` and for an explicit Nuclear Hustle group. */
export const CRAWL_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const BOT_AGENTS = ["NuclearHustleBot", "NuclearHustle"];

type Rule = { allow: boolean; pattern: string };

type Group = { agents: string[]; rules: Rule[] };

const cache = new Map<string, { expires: number; groups: Group[] }>();
const CACHE_MS = 60 * 60 * 1000;

export class RobotsDisallowedError extends Error {
  constructor(url: string) {
    super(`robots.txt disallows ${url}`);
    this.name = "RobotsDisallowedError";
  }
}

function parseRobots(body: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const splitAt = line.indexOf(":");
    if (splitAt === -1) continue;
    const field = line.slice(0, splitAt).trim().toLowerCase();
    const value = line.slice(splitAt + 1).trim();

    if (field === "user-agent") {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      continue;
    }

    if ((field === "allow" || field === "disallow") && current) {
      current.rules.push({ allow: field === "allow", pattern: value });
    }
  }

  return groups;
}

function patternToRegExp(pattern: string): RegExp {
  let source = "";
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "*") source += ".*";
    else if (char === "$" && i === pattern.length - 1) source += "$";
    else source += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp("^" + source);
}

function ruleMatches(pattern: string, pathname: string): boolean {
  if (!pattern) return false;
  return patternToRegExp(pattern).test(pathname);
}

/** Longest match wins. Allow wins a tie. Empty Disallow does not block. */
export function pathAllowedByRules(rules: Rule[], pathname: string): boolean {
  let winner: { length: number; allow: boolean } | null = null;
  for (const rule of rules) {
    if (!ruleMatches(rule.pattern, pathname)) continue;
    const length = rule.pattern.length;
    if (!winner || length > winner.length || (length === winner.length && rule.allow)) {
      winner = { length, allow: rule.allow };
    }
  }
  return winner ? winner.allow : true;
}

function groupFor(groups: Group[], agent: string): Group | undefined {
  const needle = agent.toLowerCase();
  return groups.find((group) =>
    group.agents.some((name) => name !== "*" && needle.includes(name)),
  );
}

function starGroup(groups: Group[]): Group | undefined {
  return groups.find((group) => group.agents.includes("*"));
}

export function urlAllowedByGroups(groups: Group[], pathname: string): boolean {
  const star = starGroup(groups);
  if (star && !pathAllowedByRules(star.rules, pathname)) return false;

  for (const agent of BOT_AGENTS) {
    const specific = groupFor(groups, agent);
    if (specific && !pathAllowedByRules(specific.rules, pathname)) return false;
  }

  return true;
}

async function loadGroups(origin: string): Promise<Group[]> {
  const hit = cache.get(origin);
  if (hit && hit.expires > Date.now()) return hit.groups;

  try {
    const response = await axios.get<string>(`${origin}/robots.txt`, {
      timeout: 10000,
      responseType: "text",
      validateStatus: (status) => status === 200 || status === 404,
      headers: { "User-Agent": "NuclearHustleBot/1.0 (+https://www.nuclearhustle.com/terms)" },
    });
    const groups = response.status === 200 ? parseRobots(String(response.data)) : [];
    cache.set(origin, { expires: Date.now() + CACHE_MS, groups });
    return groups;
  } catch (error) {
    console.log(`[robots] Could not read ${origin}/robots.txt: ${(error as Error).message}`);
    cache.set(origin, { expires: Date.now() + 5 * 60 * 1000, groups: [] });
    return [];
  }
}

export async function assertAllowedByRobots(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;

  const groups = await loadGroups(parsed.origin);
  if (!urlAllowedByGroups(groups, parsed.pathname)) {
    throw new RobotsDisallowedError(url);
  }
}
