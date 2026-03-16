# Nuclear Hustle

Nuclear industry job board with employer and job seeker accounts.

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **Scraper**: Cheerio + Playwright for job aggregation

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run scrape     # Run job scraper (tsx scraper/index.ts)
npm run build      # Production build
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth routes (login, signup)
│   │   ├── login/
│   │   └── signup/
│   │       ├── employer/
│   │       └── job-seeker/
│   ├── dashboard/        # Protected dashboard
│   │   ├── jobs/         # Employer job management
│   │   └── profile/      # User profile
│   ├── job/[slug]/       # Public job detail page
│   └── jobs/             # Public job listings
├── components/
│   ├── auth/             # Auth forms
│   └── dashboard/        # Dashboard components
├── lib/
│   ├── auth/actions.ts   # Server actions for auth & jobs
│   ├── supabase/         # Supabase client config
│   └── data.ts           # Job data utilities
└── middleware.ts         # Route protection

scraper/                  # Job scraping scripts
supabase/schema.sql       # Database schema
```

## Database Schema (Supabase)

Tables:
- `profiles` - Base user profile (id, email, full_name, role)
- `job_seeker_profiles` - Job seeker data (resume_url, location)
- `employer_profiles` - Employer data (company_name, company_slug, website)
- `employer_jobs` - Job postings by employers

Storage:
- `resumes` bucket for job seeker resume uploads

## Environment Variables

`.env.local` required:
```
NEXT_PUBLIC_SUPABASE_URL=https://qwxcwzxnomzusuztemyb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Current Status

### Completed
- Auth system with dual user types (employer / job seeker)
- Login/signup forms and server actions
- Dashboard with role-based views
- Employer job posting (create, edit, toggle, delete)
- Job seeker profile with resume upload
- Public job listings from scraped data
- Middleware for route protection
- Supabase client setup

### TODO
- **Run database schema**: Need to execute `supabase/schema.sql` in Supabase SQL Editor
  - URL: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new
  - This creates the tables needed for auth to work

### Known Issues
- Next.js 16 middleware deprecation warning (suggests using "proxy" instead)

## Supabase Project

- Project: Nuclearhustle
- ID: `qwxcwzxnomzusuztemyb`
- Dashboard: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb
