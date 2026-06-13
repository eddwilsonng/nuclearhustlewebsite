# Nuclear Hustle

Nuclear industry job board with employer and job seeker accounts. Specialist job board for US nuclear power plant professionals — operators, engineers, health physicists, maintenance crews.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, `font-mono` design system
- **Backend**: Supabase (Auth, Database, Storage)
- **Maps**: `react-simple-maps` — pure SVG US map, no tiles, no watermarks
- **Scraper**: Cheerio + Playwright for job aggregation

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run scrape     # Run job scraper (tsx scraper/index.ts)
npm run build      # Production build
npm run lint       # ESLint
```

## Brand / Design Tokens

All UI uses a consistent monospace-first cream palette. Never use default Tailwind rounded corners or shadows — the brand is sharp/flat.

| Token | Value | Usage |
|---|---|---|
| Background | `bg-[#EDE8DF]` | Page background, cards |
| Border | `border-[#CFC8BC]` | All dividers and card borders |
| Hover bg | `bg-[#E5DFD5]` | Row hover states |
| Accent | `bg-yellow-400` | Primary CTAs only |
| Font | `font-mono` | Everything — labels, headings, body |
| Label style | `text-xs tracking-widest uppercase` | Section labels, chips |

## Project Structure

```
src/
├── app/
│   ├── (auth)/               # Auth routes (login, signup)
│   │   ├── login/
│   │   └── signup/
│   │       ├── page.tsx      # Role picker (employer / job seeker)
│   │       ├── employer/
│   │       └── job-seeker/
│   ├── dashboard/            # Protected dashboard (employer + seeker)
│   │   ├── jobs/             # Employer job management (create/edit/toggle/delete)
│   │   └── profile/          # Job seeker profile + resume upload
│   ├── job/[slug]/           # Public job detail page (full CRO rewrite)
│   ├── jobs/                 # All jobs listing
│   │   ├── [state]/          # State-filtered jobs (e.g. /jobs/illinois)
│   │   └── role/[category]/  # Category-filtered jobs (e.g. /jobs/role/engineering)
│   ├── status/               # US reactor fleet status page with SVG map
│   └── layout.tsx            # Root layout — Header + Footer + flex min-h-screen
├── components/
│   ├── auth/
│   │   ├── JobSeekerSignupForm.tsx   # Restyled to brand
│   │   └── EmployerSignupForm.tsx    # Restyled to brand
│   ├── dashboard/
│   ├── status/
│   │   ├── ReactorMap.tsx            # react-simple-maps SVG US map
│   │   └── StateCapacityChart.tsx    # State rows linking to /jobs/[state]
│   ├── Footer.tsx                    # Global footer (4-column grid)
│   ├── Header.tsx                    # Global nav
│   ├── JobCard.tsx                   # Job row + compact variant
│   └── JobAlertForm.tsx              # Email alert capture
├── lib/
│   ├── auth/actions.ts       # Server actions for auth & jobs
│   ├── supabase/             # Supabase client config
│   ├── data/static.ts        # Job data utilities (getJobsWithCompany, etc.)
│   ├── states.ts             # US state slugs + metadata
│   └── categorize.ts         # Job category classification
└── middleware.ts              # Route protection — redirects logged-in users away from auth pages

public/
└── us-states.json            # TopoJSON for reactor map (self-hosted — CDN blocked by CSP)

scraper/                      # Job scraping scripts
supabase/
├── schema.sql                # Main DB schema
└── rate-limits-migration.sql # Rate limiting table
```

## Key Components

### JobCard (`src/components/JobCard.tsx`)
- `hideCategory` prop — pass when on a category page to suppress redundant tag
- `getPostedLabel()` — shows "Today / Yesterday / 3d ago" for fresh jobs, neutral "Jun 2025" for anything 7+ days old (no "17w ago" staleness signals)
- Category tag suppressed when `job.category === 'other'`
- Employer-direct jobs get yellow border treatment

### ReactorMap (`src/components/status/ReactorMap.tsx`)
- Uses `react-simple-maps` — no Leaflet, no tile attribution, no watermarks
- Alaska (FIPS "02") and Hawaii (FIPS "15") filtered out — no nuclear plants
- `projectionConfig={{ scale: 900 }}`, `viewBox="80 40 800 480"` — correct centering
- No `ZoomableGroup` — static map, scroll passes through to page normally
- Marker click navigates to `/jobs/${STATE_SLUGS[plant.state]}`

### Footer (`src/components/Footer.tsx`)
- 4-column: Brand, Browse (by role), Employers, Site
- In root `layout.tsx` — appears on every page
- Layout is `flex flex-col min-h-screen` on body + `<main className="flex-1">` — footer sticks to bottom

## Database Schema (Supabase)

Tables:
- `profiles` — Base user profile (id, email, full_name, role)
- `job_seeker_profiles` — Job seeker data (resume_url, location)
- `employer_profiles` — Employer data (company_name, company_slug, website)
- `employer_jobs` — Job postings by employers

Storage:
- `resumes` bucket for job seeker resume uploads (needs to be created in dashboard)

## Environment Variables

`.env.local` required:
```
NEXT_PUBLIC_SUPABASE_URL=https://qwxcwzxnomzusuztemyb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Supabase Project

- Project: Nuclearhustle
- ID: `qwxcwzxnomzusuztemyb`
- Dashboard: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb
- SQL Editor: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new

## Admin Access

Admin area is the authenticated dashboard at `/dashboard`. Access via:
1. Create an employer account at `/signup/employer`
2. Log in at `/login`
3. Navigate to `/dashboard` — employer view shows job management (create/edit/toggle/delete)

There is no separate admin panel — the employer dashboard IS the admin interface for managing job postings.

---

## What's Been Built (Session Log)

### Auth System
- Dual user types: employer and job seeker
- Login/signup forms with server actions (`src/lib/auth/actions.ts`)
- Middleware redirects logged-in users away from `/login` and `/signup/*`
- Role-based dashboard views
- Job seeker: profile + resume upload to Supabase Storage
- Employer: create/edit/toggle/delete job postings

### Public Pages
- **Homepage** (`/`) — hero with email alert capture, featured listings, latest jobs, browse by role/state, dual CTA section
- **All jobs** (`/jobs`) — full listing
- **State pages** (`/jobs/[state]`) — filtered by state, role filter chips, alert CTA, sidebar with other states + job counts
- **Category pages** (`/jobs/role/[category]`) — filtered by role, state filter chips, `hideCategory` on job cards, alert CTA, sidebar with other role counts
- **Job detail** (`/job/[slug]`) — full CRO rewrite: hero strip, sticky sidebar (Apply card + Job Details + Company + alert nudge), mobile sticky apply bar, bottom nudge. Job Details only shows Type/Field rows when data exists.
- **Fleet Status** (`/status`) — US reactor map (react-simple-maps SVG), state capacity table, full reactor list. All data points link to `/jobs/[state]`. Hero has jump links to sections.

### Design System
- All auth pages restyled to brand (monospace, cream, no rounded corners)
- Global `Footer` component — replaces embedded footer that was on homepage
- `JobCard` — neutral timestamps, suppressed "OTHER" tag, `hideCategory` prop
- Consistent `font-mono text-xs tracking-widest uppercase` for all labels

---

## Launch Checklist

### Before going live
- [ ] Run `supabase/schema.sql` in Supabase SQL Editor
- [ ] Run `supabase/rate-limits-migration.sql`
- [ ] Create `resumes` storage bucket in Supabase dashboard (set to private)
- [ ] Configure Supabase Auth → Site URL: `https://nuclearhustle.com`
- [ ] Add `https://nuclearhustle.com/auth/callback` to Supabase Auth redirect URLs
- [ ] Deploy to Vercel — add all `.env.local` vars as Vercel environment variables
- [ ] Point domain `nuclearhustle.com` to Vercel
- [ ] Set up Stripe — create product ($99 featured listing), add webhook, add `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` env vars
- [ ] Set up Resend — verify sending domain, add `RESEND_API_KEY` env var
- [ ] Run scraper (`npm run scrape`) to populate production job data
- [ ] Test auth flow end-to-end (sign up, log in, post a job, upload resume)

### Known Issues / Warnings
- Next.js 16 middleware deprecation warning — suggests using `"proxy"` mode (non-breaking, can address post-launch)
