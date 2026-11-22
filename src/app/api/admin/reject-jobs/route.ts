import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { recordAgentRun } from '@/lib/ops/runLog';
import { adminGuard } from '@/lib/admin/session';

const JOBS_PATH = path.join(process.cwd(), 'src/data/jobs.json');

/**
 * Bulk-reject reviewed jobs. Body: { jobIds: string[] }.
 * Only affects jobs currently pending_review.
 */
export async function POST(request: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { jobIds } = await request.json();
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return NextResponse.json({ error: 'Missing jobIds' }, { status: 400 });
  }

  const started = new Date();
  const data = JSON.parse(fs.readFileSync(JOBS_PATH, 'utf-8'));
  const idSet = new Set(jobIds);
  let rejected = 0;

  data.jobs = data.jobs.map((j: { id: string; status?: string }) => {
    if (idSet.has(j.id) && j.status === 'pending_review') {
      rejected++;
      return { ...j, status: 'rejected' };
    }
    return j;
  });

  fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2));

  const finished = new Date();
  recordAgentRun({
    type: 'review-action',
    label: `Bulk reject — ${rejected} job${rejected === 1 ? '' : 's'}`,
    status: 'success',
    startedAt: started.toISOString(),
    finishedAt: finished.toISOString(),
    durationMs: finished.getTime() - started.getTime(),
    stats: { rejected },
  });

  return NextResponse.json({ success: true, rejected });
}
