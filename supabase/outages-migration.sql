-- Outage schedule tables.
-- Run in: https://supabase.com/dashboard/project/qwxcwzxnomzusuztemyb/sql/new
--
-- Safe to re-run. Seeds the 96 active units from src/data/plants.json.
-- plant_id matches that file's id. There is no plants table.
-- Retired units are not seeded here. The backfill inserts them with
-- active = false and plant_id null, and it does not attach them to a plant page.
--
-- unit_daily_status upserts are idempotent on (unit_id, report_date).
-- A daily-page scrape may fill down_date, reason_comment, and scrams.
-- It must not write power_pct as null. power_pct is NOT NULL so that is enforced.

CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id text,
  unit_number smallint,
  nrc_name text NOT NULL,
  nrc_aliases text[] NOT NULL DEFAULT '{}',
  reactor_type text CHECK (reactor_type IS NULL OR reactor_type IN ('PWR', 'BWR')),
  active boolean NOT NULL DEFAULT true,
  status_override text CHECK (status_override IS NULL OR status_override IN ('restarting')),
  status_override_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS units_nrc_name_idx ON public.units (nrc_name);
CREATE INDEX IF NOT EXISTS units_plant_id_idx ON public.units (plant_id);
CREATE INDEX IF NOT EXISTS units_nrc_aliases_idx ON public.units USING gin (nrc_aliases);

CREATE TABLE IF NOT EXISTS public.unit_daily_status (
  unit_id uuid NOT NULL REFERENCES public.units (id) ON DELETE CASCADE,
  report_date date NOT NULL,
  power_pct smallint NOT NULL CHECK (power_pct >= 0 AND power_pct <= 200),
  down_date date,
  reason_comment text,
  scrams smallint CHECK (scrams IS NULL OR scrams >= 0),
  source text NOT NULL CHECK (source IN ('nrc_365', 'nrc_yearly', 'nrc_daily_page')),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (unit_id, report_date)
);

CREATE INDEX IF NOT EXISTS unit_daily_status_report_date_idx
  ON public.unit_daily_status (report_date);

CREATE TABLE IF NOT EXISTS public.outages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units (id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  duration_days integer CHECK (duration_days IS NULL OR duration_days >= 0),
  type text NOT NULL CHECK (type IN ('refueling', 'unplanned', 'maintenance', 'unknown')),
  classification_score integer NOT NULL DEFAULT 0,
  classification_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_extended boolean NOT NULL DEFAULT false,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS outages_unit_start_idx
  ON public.outages (unit_id, start_date);
CREATE UNIQUE INDEX IF NOT EXISTS outages_one_current_per_unit_idx
  ON public.outages (unit_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS outages_unit_id_idx ON public.outages (unit_id);

CREATE TABLE IF NOT EXISTS public.outage_forecasts (
  unit_id uuid PRIMARY KEY REFERENCES public.units (id) ON DELETE CASCADE,
  forecast_start date NOT NULL,
  window_start date NOT NULL,
  window_end date NOT NULL,
  forecast_duration_days integer NOT NULL CHECK (forecast_duration_days >= 0),
  confidence text NOT NULL CHECK (confidence IN ('forecast', 'isi_letter', 'coastdown', 'started')),
  basis jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (window_start <= forecast_start AND forecast_start <= window_end)
);

CREATE TABLE IF NOT EXISTS public.unit_state (
  unit_id uuid PRIMARY KEY REFERENCES public.units (id) ON DELETE CASCADE,
  state text NOT NULL CHECK (state IN (
    'restarting',
    'extended_shutdown',
    'refueling_outage',
    'unplanned_outage',
    'coastdown',
    'reduced',
    'full_power',
    'unknown'
  )),
  state_since date,
  power_pct smallint CHECK (power_pct IS NULL OR (power_pct >= 0 AND power_pct <= 200)),
  outage_id uuid REFERENCES public.outages (id) ON DELETE SET NULL,
  day_of_outage integer CHECK (day_of_outage IS NULL OR day_of_outage >= 1),
  expected_return date,
  report_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_daily_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outage_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_state ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read units" ON public.units
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read unit daily status" ON public.unit_daily_status
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read outages" ON public.outages
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read outage forecasts" ON public.outage_forecasts
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can read unit state" ON public.unit_state
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Active fleet. Re-running updates the plant link and the restarting override.
-- It does not clear nrc_aliases or reactor_type, so a later backfill can keep those.
INSERT INTO public.units (plant_id, unit_number, nrc_name, status_override, status_override_note)
VALUES
  ('arkansas-nuclear-one', 1, 'Arkansas Nuclear 1', NULL, NULL),
  ('arkansas-nuclear-one', 2, 'Arkansas Nuclear 2', NULL, NULL),
  ('beaver-valley', 1, 'Beaver Valley 1', NULL, NULL),
  ('beaver-valley', 2, 'Beaver Valley 2', NULL, NULL),
  ('braidwood', 1, 'Braidwood 1', NULL, NULL),
  ('braidwood', 2, 'Braidwood 2', NULL, NULL),
  ('browns-ferry', 1, 'Browns Ferry 1', NULL, NULL),
  ('browns-ferry', 2, 'Browns Ferry 2', NULL, NULL),
  ('browns-ferry', 3, 'Browns Ferry 3', NULL, NULL),
  ('brunswick', 1, 'Brunswick 1', NULL, NULL),
  ('brunswick', 2, 'Brunswick 2', NULL, NULL),
  ('byron', 1, 'Byron 1', NULL, NULL),
  ('byron', 2, 'Byron 2', NULL, NULL),
  ('callaway', NULL, 'Callaway', NULL, NULL),
  ('calvert-cliffs', 1, 'Calvert Cliffs 1', NULL, NULL),
  ('calvert-cliffs', 2, 'Calvert Cliffs 2', NULL, NULL),
  ('columbia', NULL, 'Columbia Generating Station', NULL, NULL),
  ('comanche-peak', 1, 'Comanche Peak 1', NULL, NULL),
  ('comanche-peak', 2, 'Comanche Peak 2', NULL, NULL),
  ('cook', 1, 'D.C. Cook 1', NULL, NULL),
  ('cook', 2, 'D.C. Cook 2', NULL, NULL),
  ('cooper', NULL, 'Cooper', NULL, NULL),
  ('davis-besse', NULL, 'Davis-Besse', NULL, NULL),
  ('diablo-canyon', 1, 'Diablo Canyon 1', NULL, NULL),
  ('diablo-canyon', 2, 'Diablo Canyon 2', NULL, NULL),
  ('dresden', 2, 'Dresden 2', NULL, NULL),
  ('dresden', 3, 'Dresden 3', NULL, NULL),
  ('farley', 1, 'Farley 1', NULL, NULL),
  ('farley', 2, 'Farley 2', NULL, NULL),
  ('fermi', 2, 'Fermi 2', NULL, NULL),
  ('fitzpatrick', NULL, 'FitzPatrick', NULL, NULL),
  ('ginna', NULL, 'Ginna', NULL, NULL),
  ('grand-gulf', 1, 'Grand Gulf 1', NULL, NULL),
  ('harris', 1, 'Harris 1', NULL, NULL),
  ('hatch', 1, 'Hatch 1', NULL, NULL),
  ('hatch', 2, 'Hatch 2', NULL, NULL),
  ('hope-creek', 1, 'Hope Creek 1', NULL, NULL),
  ('lasalle', 1, 'LaSalle 1', NULL, NULL),
  ('lasalle', 2, 'LaSalle 2', NULL, NULL),
  ('limerick', 1, 'Limerick 1', NULL, NULL),
  ('limerick', 2, 'Limerick 2', NULL, NULL),
  ('mcguire', 1, 'McGuire 1', NULL, NULL),
  ('mcguire', 2, 'McGuire 2', NULL, NULL),
  ('millstone', 2, 'Millstone 2', NULL, NULL),
  ('millstone', 3, 'Millstone 3', NULL, NULL),
  ('monticello', NULL, 'Monticello', NULL, NULL),
  ('nine-mile-point', 1, 'Nine Mile Point 1', NULL, NULL),
  ('nine-mile-point', 2, 'Nine Mile Point 2', NULL, NULL),
  ('north-anna', 1, 'North Anna 1', NULL, NULL),
  ('north-anna', 2, 'North Anna 2', NULL, NULL),
  ('oconee', 1, 'Oconee 1', NULL, NULL),
  ('oconee', 2, 'Oconee 2', NULL, NULL),
  ('oconee', 3, 'Oconee 3', NULL, NULL),
  ('palo-verde', 1, 'Palo Verde 1', NULL, NULL),
  ('palo-verde', 2, 'Palo Verde 2', NULL, NULL),
  ('palo-verde', 3, 'Palo Verde 3', NULL, NULL),
  ('peach-bottom', 2, 'Peach Bottom 2', NULL, NULL),
  ('peach-bottom', 3, 'Peach Bottom 3', NULL, NULL),
  ('perry', 1, 'Perry 1', NULL, NULL),
  ('point-beach', 1, 'Point Beach 1', NULL, NULL),
  ('point-beach', 2, 'Point Beach 2', NULL, NULL),
  ('prairie-island', 1, 'Prairie Island 1', NULL, NULL),
  ('prairie-island', 2, 'Prairie Island 2', NULL, NULL),
  ('quad-cities', 1, 'Quad Cities 1', NULL, NULL),
  ('quad-cities', 2, 'Quad Cities 2', NULL, NULL),
  ('robinson', 2, 'Robinson 2', NULL, NULL),
  ('salem', 1, 'Salem 1', NULL, NULL),
  ('salem', 2, 'Salem 2', NULL, NULL),
  ('seabrook', 1, 'Seabrook 1', NULL, NULL),
  ('sequoyah', 1, 'Sequoyah 1', NULL, NULL),
  ('sequoyah', 2, 'Sequoyah 2', NULL, NULL),
  ('south-texas', 1, 'South Texas 1', NULL, NULL),
  ('south-texas', 2, 'South Texas 2', NULL, NULL),
  ('st-lucie', 1, 'Saint Lucie 1', NULL, NULL),
  ('st-lucie', 2, 'Saint Lucie 2', NULL, NULL),
  ('surry', 1, 'Surry 1', NULL, NULL),
  ('surry', 2, 'Surry 2', NULL, NULL),
  ('susquehanna', 1, 'Susquehanna 1', NULL, NULL),
  ('susquehanna', 2, 'Susquehanna 2', NULL, NULL),
  ('three-mile-island', 1, 'Three Mile Island 1', 'restarting', 'Crane Clean Energy Center is returning to service and can be missing from the NRC operating report.'),
  ('turkey-point', 3, 'Turkey Point 3', NULL, NULL),
  ('turkey-point', 4, 'Turkey Point 4', NULL, NULL),
  ('vogtle', 1, 'Vogtle 1', NULL, NULL),
  ('vogtle', 2, 'Vogtle 2', NULL, NULL),
  ('vogtle', 3, 'Vogtle 3', NULL, NULL),
  ('vogtle', 4, 'Vogtle 4', NULL, NULL),
  ('waterford', 3, 'Waterford 3', NULL, NULL),
  ('watts-bar', 1, 'Watts Bar 1', NULL, NULL),
  ('watts-bar', 2, 'Watts Bar 2', NULL, NULL),
  ('wolf-creek', 1, 'Wolf Creek 1', NULL, NULL),
  ('catawba', 1, 'Catawba 1', NULL, NULL),
  ('catawba', 2, 'Catawba 2', NULL, NULL),
  ('clinton', NULL, 'Clinton', NULL, NULL),
  ('palisades', NULL, 'Palisades', 'restarting', 'Returning to service. The NRC operating report may omit this unit.'),
  ('river-bend', 1, 'River Bend Station 1', NULL, NULL),
  ('summer', NULL, 'Summer', NULL, NULL)
ON CONFLICT (nrc_name) DO UPDATE SET
  plant_id = EXCLUDED.plant_id,
  unit_number = EXCLUDED.unit_number,
  active = true,
  status_override = EXCLUDED.status_override,
  status_override_note = EXCLUDED.status_override_note;
