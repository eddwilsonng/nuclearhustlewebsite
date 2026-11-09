import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminGuard } from '@/lib/admin/session';

const JOBS_PATH = path.join(process.cwd(), 'src/data/jobs.json');

export async function POST(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { jobId } = await request.json();
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

  const raw = fs.readFileSync(JOBS_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const jobIndex = data.jobs.findIndex((j: { id: string }) => j.id === jobId);

  if (jobIndex === -1) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  data.jobs[jobIndex] = { ...data.jobs[jobIndex], status: 'rejected' };
  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2));

  return NextResponse.json({ success: true });
}
