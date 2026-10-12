---
name: site-qa
description: Simulate real Nuclear Hustle users end to end (employer and job seeker signup, posting a job, applying with a CV, saving jobs, resume upload, application management, job alerts and unsubscribe) and smoke-test every public page. Use when the user wants to test the site, check everything works, QA a change, verify a deploy, or reproduce a user-reported bug like a failed application.
---

# Site QA

Playwright suites in `e2e/`. Pick the mode from what the user asked, run it, then report.

| Mode | Command | Writes data? |
|---|---|---|
| Full local run (default) | `npm run test:e2e` | Yes, tagged test data in the shared Supabase project, auto-deleted |
| User flows only | `npm run test:flows` | Yes, as above |
| Production smoke | `npm run test:smoke:prod` | Two `rate_limits` rows only |
| Smoke another URL | `E2E_BASE_URL=<url> npm run test:smoke` | Two `rate_limits` rows only |

- After a deploy, or when the user reports a live problem, run the production smoke first.
- After code changes, run the full local suite. It builds the app (`next build && next start`) unless a server is already on port 3000. `E2E_DEV=1` uses `next dev` instead, which is faster to boot but flaky under parallel load.
- Never point the flows at production. They create accounts, a public job posting and applications. The config only enables the `flows` project for `http://localhost:3000`.
- Run with `required_permissions: ["full_network"]` (Supabase, Resend) and `block_until_ms` of at least 600000.

## What's covered

- `e2e/flows/marketplace.spec.ts`, serial: employer signup → auth-page redirect → posting validation → post a job taking email applications → public listing and search → guest applies with a CV → apply API rejects bad files, foreign origins and lookalike referers → rate limit (5 per 10 min) → guest Save prompts signup → seeker signs up and returns to the job → save and Saved page → profile update and resume upload → prefilled application → seeker blocked from employer pages → employer sees applications and changes status → deactivate closes applications → delete → sign out.
- `e2e/flows/alerts.spec.ts`: homepage alert signup, invalid email, forged unsubscribe token, email unsubscribe link, resubscribe, RFC 8058 one-click POST.
- `e2e/smoke/public.spec.ts`, read-only: about 20 key pages load with no page errors or 5xx, a sample of sitemap URLs resolves, robots.txt, job detail has apply/save/JobPosting JSON-LD, 404 for an unknown job, search, the dashboard login redirect, a bad-login error, the apply endpoint accepting both apex and www origins, and alert/unsubscribe validation.
- `e2e/public-a11y.spec.ts`: header, skip link, search, nested-control rules and axe WCAG 2.2 AA on key pages.

## Test data

- Emails are `delivered+nh-e2e-<runId>-<role>@resend.dev`. That's Resend's sandbox inbox, so application and alert emails really send without reaching anyone.
- Global setup and teardown (`e2e/support/global-*.ts`) delete every `nh-e2e` auth user, their storage files and their alert rows. Profiles, jobs, applications and saved jobs cascade from `auth.users`. Set `E2E_KEEP_DATA=1` to inspect the data afterwards, then run the suite again (or any test) to sweep it.
- While the flows run, the test job (`E2E Test Reactor Operator <runId>`) is briefly visible on the live board, because production reads the same database.

## Reporting

1. Lead with pass/fail counts per project.
2. For each failure, read `test-results/<test>/error-context.md` and the screenshot, then say whether it's a **site bug** (fix it or propose a fix) or a **test problem** (timing, selector drift after a UI change). Fix test problems in the spec.
3. Re-run only what failed: `npx playwright test <file> -g "<test name>"`.
4. Full HTML report: `npx playwright show-report`.
