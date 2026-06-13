import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const JOBS_PATH = path.join(process.cwd(), 'src/data/jobs.json');

export async function GET() {
  const raw = fs.readFileSync(JOBS_PATH, 'utf-8');
  const data = JSON.parse(raw);

  const pending = data.jobs.filter(
    (j: { status?: string }) => j.status === 'pending_review'
  );

  return NextResponse.json({ jobs: pending });
}
