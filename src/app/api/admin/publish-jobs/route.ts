import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { recordAgentRun } from '@/lib/ops/runLog';

const JOBS_PATH = path.join(process.cwd(), 'src/data/jobs.json');

function isAdmin(request: NextRequest): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const authHeader = request.headers.get('x-admin-email');
  return !!adminEmail && authHeader === adminEmail;
}

/**
 * Bulk-publish reviewed jobs. Body: { jobIds: string[] }.
 * Only flips jobs that are currently pending_review.
 */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobIds } = await request.json();
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return NextResponse.json({ error: 'Missing jobIds' }, { status: 400 });
  }

  const started = new Date();
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8'));
  const idSet = new Set(jobIds);
  let published = 0;

  data.jobs = data.jobs.map((j: { id: string; status?: string }) => {
    if (idSet.has(j.id) && j.status === 'pending_review') {
      published++;
      return { ...j, status: 'published' };
    }
    return j;
  });

  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2));

  const finished = new Date();
  recordAgentRun({
    type: 'review-action',
    label: `Bulk approve — ${published} job${published === 1 ? '' : 's'}`,
    status: 'success',
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    durationMs: finished.getTime() - started.getTime(),
    stats: { published },
  });

  return NextResponse.json({ success: true, published });
}
