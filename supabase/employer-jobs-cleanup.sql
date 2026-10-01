-- One-off cleanup for employer_jobs. Safe to re-run.

-- 1. Deactivate test listings so they don't surface on the public boards.
UPDATE public.employer_jobs
SET is_active = false
WHERE employer_id IN (
  SELECT id FROM public.employer_profiles WHERE company_slug IN ('dsfsdfs', 'edd-nuclear')
);

-- 2. Backfill state: older rows stored the raw postal code ("pa") instead of the slug.
WITH state_map (code, slug) AS (
  VALUES
    ('al','alabama'),('ak','alaska'),('az','arizona'),('ar','arkansas'),('ca','california'),
    ('co','colorado'),('ct','connecticut'),('de','delaware'),('fl','florida'),('ga','georgia'),
    ('hi','hawaii'),('id','idaho'),('il','illinois'),('in','indiana'),('ia','iowa'),
    ('ks','kansas'),('ky','kentucky'),('la','louisiana'),('me','maine'),('md','maryland'),
    ('ma','massachusetts'),('mi','michigan'),('mn','minnesota'),('ms','mississippi'),
    ('mo','missouri'),('mt','montana'),('ne','nebraska'),('nv','nevada'),('nh','new-hampshire'),
    ('nj','new-jersey'),('nm','new-mexico'),('ny','new-york'),('nc','north-carolina'),
    ('nd','north-dakota'),('oh','ohio'),('ok','oklahoma'),('or','oregon'),('pa','pennsylvania'),
    ('ri','rhode-island'),('sc','south-carolina'),('sd','south-dakota'),('tn','tennessee'),
    ('tx','texas'),('ut','utah'),('vt','vermont'),('va','virginia'),('wa','washington'),
    ('wv','west-virginia'),('wi','wisconsin'),('wy','wyoming'),('dc','district-of-columbia')
)
UPDATE public.employer_jobs AS j
SET state = m.slug
FROM state_map AS m
WHERE lower(j.state) = m.code;

-- 3. Fill state for rows whose location names a plant instead of a city.
UPDATE public.employer_jobs SET state = 'pennsylvania'
WHERE state IS NULL AND location ILIKE ANY (ARRAY['%limerick%', '%crane clean energy%']);
