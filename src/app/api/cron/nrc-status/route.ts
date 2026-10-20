import { NextRequest, NextResponse } from 'next/server';
import { NRC_POWER_STATUS_URL, nrcDailyUrl } from '@/lib/outages/config';
import { fetchNrc } from '@/lib/outages/nrcClient';
import { dailyPageHasReasonColumn, parseDailyReportPage, parsePowerStatusFile } from '@/lib/outages/nrcParse';
import {
  indexUnits,
  loadUnits,
  resolveCommentWrites,
  resolvePowerWrites,
  upsertCommentRows,
  upsertPowerRows,
} from '@/lib/outages/nrcWrite';
import { rebuildOutages } from '@/lib/outages/rebuild';
import { createAdminClient } from '@/lib/supabase/admin';

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
}

function daysAgoInNewYork(days: number): string {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = createAdminClient();
    const byName = indexUnits(await loadUnits(db));

    const powerFile = await fetchNrc(NRC_POWER_STATUS_URL);
    const powerRows = parsePowerStatusFile(powerFile.text);
    const power = resolvePowerWrites(powerRows, byName, 'nrc_365');
    if (power.unmatched.length > 0) {
      console.warn(
        `[nrc-status] Unmatched power names: ${power.unmatched.map((row) => row.name).join(', ')}`,
      );
    }
    await upsertPowerRows(power.writes);

    const commentDates: string[] = [];
    let commentsWritten = 0;
    const commentUnmatched = new Set<string>();
    for (let daysAgo = 29; daysAgo <= 35; daysAgo += 1) {
      const commentDate = daysAgoInNewYork(daysAgo);
      const commentPage = await fetchNrc(nrcDailyUrl(commentDate));
      if (commentPage.status === 404 || !/<tr\b/i.test(commentPage.text)) {
        console.warn(`[nrc-status] No daily page for ${commentDate}`);
        continue;
      }
      if (!dailyPageHasReasonColumn(commentPage.text)) {
        console.warn(`[nrc-status] ${commentDate} has no reason column yet`);
        continue;
      }
      const comments = resolveCommentWrites(
        parseDailyReportPage(commentPage.text),
        commentDate,
        byName,
      );
      for (const name of comments.unmatched) commentUnmatched.add(name);
      if (comments.unmatched.length > 0) {
        console.warn(`[nrc-status] Unmatched comment names: ${comments.unmatched.join(', ')}`);
      }
      await upsertCommentRows(comments.writes);
      commentsWritten += comments.writes.length;
      commentDates.push(commentDate);
    }

    const rebuilt = await rebuildOutages(db);
    return NextResponse.json({
      success: true,
      powerRows: power.writes.length,
      unmatchedPower: power.unmatched.map((row) => row.name),
      commentDates,
      commentsWritten,
      outages: rebuilt.outages,
      forecasts: rebuilt.forecasts,
      byState: rebuilt.byState,
      missingBoth: rebuilt.missingBoth,
      unmatchedComments: [...commentUnmatched],
    });
  } catch (error) {
    console.error('[nrc-status]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
