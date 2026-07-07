'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getCurrentWeekId } from '@/lib/date/week';

export interface PublishResult {
  ok: boolean;
  error?: string;
}

/**
 * Freeze the current week's curated set. Admin-gated in app code; RLS on
 * `weekly_picks` additionally blocks anonymous writes. Upserts on the ISO week
 * id so re-publishing the same week replaces (and re-timestamps) the set.
 */
export async function publishWeeklyPicks(slugs: string[]): Promise<PublishResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) return { ok: false, error: 'Not authorized' };
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return { ok: false, error: 'Select at least one role before publishing.' };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('weekly_picks').upsert(
    {
      week_id: getCurrentWeekId(),
      job_slugs: slugs,
      published_at: now,
      updated_at: now,
    },
    { onConflict: 'week_id' }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath('/this-week');
  return { ok: true };
}
