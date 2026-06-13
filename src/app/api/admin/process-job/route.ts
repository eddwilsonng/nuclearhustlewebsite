import { NextRequest, NextResponse } from 'next/server';
import { formatJobDescription } from '@/lib/formatJobDescription';
import { reviewJobDescription } from '@/lib/reviewJobDescription';
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

  const { jobId } = await request.json();
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });

  const raw = fs.readFileSync(JOBS_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const jobIndex = data.jobs.findIndex((j: { id: string }) => j.id === jobId);

  if (jobIndex === -1) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const job = data.jobs[jobIndex];

  if (!job.description) {
    return NextResponse.json({ error: 'Job has no description to process' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  try {
    // Pass 1: format
    const formatted = await formatJobDescription(job.description, job.title, job.company_id);

    // Pass 2: agent review
    const reviewed = await reviewJobDescription(formatted, job.title, job.company_id, job.category);

    data.jobs[jobIndex] = {
      ...job,
      structured_description: reviewed.structured_description,
      review_notes: reviewed.review_notes,
      agent_confidence: reviewed.agent_confidence,
      status: 'pending_review',
    };

    fs.writeFileSync(JOBS_PATH, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, job: data.jobs[jobIndex] });
  } catch (err) {
    console.error('[process-job]', err);
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}
