import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminGuard } from '@/lib/admin/session';

const JOBS_PATH = path.join(process.cwd(), 'src/data/jobs.json');

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const raw = fs.readFileSync(JOBS_PATH, 'utf-8');
  const data = JSON.parse(raw);

  const pending = data.jobs.filter(
    (j: { status?: string }) => j.status === 'pending_review'
  );

  return NextResponse.json({ jobs: pending });
}
