#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const chunksDir = path.join(process.cwd(), ".next/static/chunks");
if (!fs.existsSync(chunksDir)) {
  console.error("Run `npm run build` before check:client-bundle.");
  process.exit(1);
}

const offenders = [];
for (const file of fs.readdirSync(chunksDir)) {
  if (!file.endsWith(".js")) continue;
  const fullPath = path.join(chunksDir, file);
  const stat = fs.statSync(fullPath);
  const sample = fs.readFileSync(fullPath, "utf8").slice(0, 200_000);
  if (sample.includes('"jobs":[') && sample.includes("company_id")) {
    offenders.push(file);
  }
  if (stat.size > 2_000_000) {
    offenders.push(`${file} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
  }
}

if (offenders.length > 0) {
  console.error("Client bundle check failed:");
  for (const item of [...new Set(offenders)]) {
    console.error(`  - ${item}`);
  }
  process.exit(1);
}

console.log("Client bundle check passed.");
