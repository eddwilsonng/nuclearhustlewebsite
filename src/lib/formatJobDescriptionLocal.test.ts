import assert from "node:assert/strict";
import test from "node:test";
import { formatJobDescriptionLocal } from "./formatJobDescriptionLocal";

test("experience lines stay one qualification each", () => {
  const raw = `
Key Qualifications and Skills
Bachelor's degree in engineering or a related technical discipline.
15+ years in nuclear engineering environments.
Experience with EDMS and CMIS systems, including data structures.
Experience managing configuration teams aligned with traceability requirements.
Preferred Qualifications
Prior director experience in configuration management.
`;
  const sd = formatJobDescriptionLocal(raw, "Director, Configuration Management");
  const quals = sd.qualifications?.split("\n") ?? [];
  assert.ok(quals.some((line) => line.startsWith("- Bachelor's degree")));
  assert.ok(quals.some((line) => line.includes("15+ years")));
  assert.ok(quals.some((line) => line.startsWith("- Experience with EDMS")));
  assert.ok(quals.some((line) => line.startsWith("- Experience managing")));
  assert.equal(quals.some((line) => /^- with EDMS/.test(line)), false);
  assert.match(sd.desired ?? "", /Prior director experience/);
});

test("flattened duty verbs become separate bullets", () => {
  const raw = `
Position Specific Description The Maintenance Technician oversees facility and maintenance tasks at the plant. In this role you will keep the equipment safe.
Job Duties & Responsibilities Facility Duties Performs plant laundry tasks, including collecting and surveying supplies Operates decontamination equipment, including a high-pressure washer Maintains grounds, including lawn care and snow removal Serves as firewatch and confined space attendant
Qualifications: High School Diploma or GED required
`;
  const sd = formatJobDescriptionLocal(raw, "Maintenance Technician");
  const duties = sd.responsibilities?.split("\n") ?? [];
  assert.ok(duties.some((line) => /Performs plant laundry/.test(line)));
  assert.ok(duties.some((line) => /Operates decontamination/.test(line)));
  assert.ok(duties.some((line) => /Maintains grounds/.test(line)));
  assert.ok(duties.some((line) => /Serves as firewatch/.test(line)));
  assert.ok((sd.about ?? "").includes("Maintenance Technician"));
  assert.equal(/largest wholesale/.test(sd.about ?? ""), false);
});

test("inline qualifications and preferred lines leave the duty list", () => {
  const raw = `
About the role: As a Mechanical Assembler you will build first-of-a-kind equipment and report to the Operations Manager. You will be 100% onsite.
Key Responsibilities: Small assembly builds Large assembly builds Perform assembly activities without guidance Use overhead cranes Operate forklifts Qualifications: High School Diploma or GED required 2+ years of experience CNC operator experience preferred Production welding experience preferred
The hourly pay range for this position is estimated to be $23.00 to $28.00 per hour.
`;
  const sd = formatJobDescriptionLocal(raw, "Mechanical Assembler");
  const duties = sd.responsibilities ?? "";
  const quals = sd.qualifications ?? "";
  assert.match(duties, /Perform assembly activities/);
  assert.match(duties, /Operate forklifts/);
  assert.equal(/High School Diploma/.test(duties), false);
  assert.match(quals, /High School Diploma/);
  assert.match(quals, /2\+ years of experience/);
  assert.match(sd.desired ?? "", /CNC operator experience preferred/);
  assert.match(sd.desired ?? "", /Production welding experience preferred/);
  assert.match(sd.notices ?? "", /\$23\.00 to \$28\.00/);
  assert.equal(/Why Westinghouse/.test(sd.notices ?? ""), false);
  assert.match(sd.location_details ?? "", /On-site/);
});
