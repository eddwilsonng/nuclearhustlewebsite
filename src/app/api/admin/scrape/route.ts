import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const STATUS_PATH = path.join(process.cwd(), '.scrape-status.json');

const VALID_COMPANIES = ['constellation', 'duke', 'dominion', 'entergy', 'nextera', 'tva'];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const companyId = body.companyId;

  if (!companyId || !VALID_COMPANIES.includes(companyId)) {
    return NextResponse.json(
      { error: `Invalid company. Must be one of: ${VALID_COMPANIES.join(', ')}` },
      { status: 400 }
    );
  }

  // Prevent concurrent scrapes
  if (fs.existsSync(STATUS_PATH)) {
    try {
      const current = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
      if (current.status === 'running') {
        return NextResponse.json(
          { error: `A scrape is already running for ${current.companyName}` },
          { status: 409 }
        );
      }
    } catch {
      // Corrupted file, proceed
    }
  }

  // Spawn the scraper with only the env vars it actually needs (no Stripe/admin keys)
  const scraperEnv: NodeJS.ProcessEnv = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    NODE_ENV: process.env.NODE_ENV ?? 'production',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  };

  const child = spawn('npx', ['tsx', 'scraper/run-single.ts', `--company=${companyId}`], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
    env: scraperEnv,
  });

  child.unref();

  return NextResponse.json({ started: true, companyId, pid: child.pid });
}
