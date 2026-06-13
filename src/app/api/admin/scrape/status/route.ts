import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import * as fs from 'fs';
import * as path from 'path';

const STATUS_PATH = path.join(process.cwd(), '.scrape-status.json');

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!fs.existsSync(STATUS_PATH)) {
    return NextResponse.json({
      status: 'idle',
      company: null,
      companyName: null,
      startedAt: null,
      phase: null,
      jobsFound: 0,
      newJobs: 0,
      updatedJobs: 0,
      completedAt: null,
      error: null,
    });
  }

  try {
    const status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf-8'));
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ status: 'idle' });
  }
}
