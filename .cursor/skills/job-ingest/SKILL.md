---
name: job-ingest
description: Run the Nuclear Hustle job ingest pipeline (crawl career sites, AI-review relevance, auto-publish high-confidence, hygiene). Use when the user wants to scrape jobs, ingest listings, refresh the job board, run the scraper, or review newly crawled roles.
---

# Job ingest

One command. Do not run `scrape`, `process-jobs`, and `hygiene` separately unless asked.

```bash
npm run ingest
```

That crawls enabled sources, keyword-filters, one-pass Haiku review, auto-publishes high-confidence nuclear jobs, expires dead listings, and writes `scraper/last-run.json`.

## After it finishes

1. Read `scraper/last-run.json`.
2. Show the user:
   - sources ok / failed / skipped
   - **published this run** (already live in `jobs.json`)
   - **flagged** (still `pending_review` — these need a look)
   - rejected + newly expired
3. For each flagged job, recommend publish or reject in one line (title, company, reason).
4. If they say drop / reject specific ones, set those jobs' `status` to `rejected` in `src/data/jobs.json`.
5. If they say publish specific flagged ones, set `status` to `published`.
6. **Do not git commit** unless they ask. After they approve the delta: commit `src/data/jobs.json`, `src/data/companies.json`, and `src/data/expired-slugs.json`.

## Rules

- Ingest does not commit or push. Vercel only updates after a commit.
- GitHub Action is crawl + hygiene only — it does not auto-publish.
- `run-single.ts --company=<id>` still works to test one source.
- Never run ingest and then bulk-publish flagged jobs without showing them first.
