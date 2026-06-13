import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const JOBS_PATH = path.join(process.cwd(), 'src/data/jobs.json');

function isAdmin(request: NextRequest): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const authHeader = request.headers.get('x-admin-email');
  return !!adminEmail && authHeader === adminEmail;
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId, structured_description } = await request.json();
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

  const raw = fs.readFileSync(JOBS_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const jobIndex = data.jobs.findIndex((j: { id: string }) => j.id === jobId);

  if (jobIndex === -1) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  data.jobs[jobIndex] = {
    ...data.jobs[jobIndex],
    status: 'published',
    ...(structured_description ? { structured_description } : {}),
  };

  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2));

  return NextResponse.json({ success: true });
}
