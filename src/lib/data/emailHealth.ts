import { createAdminClient } from '@/lib/supabase/admin';

export interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
}

export interface EventStats {
  windowDays: number;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  delayed: number;
  // Rates as percentages (0–100), relative to attempted (delivered + bounced).
  bounceRate: number;
  complaintRate: number;
}

export interface EmailHealth {
  subscribers: SubscriberStats;
  // null when the email_events table doesn't exist yet (migration not run)
  // or the webhook hasn't been wired up.
  events: EventStats | null;
}

const EVENT_WINDOW_DAYS = 30;

async function getSubscriberStats(): Promise<SubscriberStats> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('job_alert_subscribers')
    .select('unsubscribed_at');

  if (error || !data) {
    return { total: 0, active: 0, unsubscribed: 0 };
  }

  const unsubscribed = data.filter((row) => row.unsubscribed_at !== null).length;
  return {
    total: data.length,
    active: data.length - unsubscribed,
    unsubscribed,
  };
}

async function getEventStats(): Promise<EventStats | null> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - EVENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from('email_events')
    .select('event_type')
    .gte('created_at', since);

  // Table missing (migration not run) or any other error → no event data yet.
  if (error || !data) {
    return null;
  }

  const count = (type: string) => data.filter((row) => row.event_type === type).length;

  const sent = count('email.sent');
  const delivered = count('email.delivered');
  const bounced = count('email.bounced');
  const complained = count('email.complained');
  const delayed = count('email.delivery_delayed');

  const attempted = delivered + bounced;
  const round = (n: number) => Math.round(n * 10) / 10;

  return {
    windowDays: EVENT_WINDOW_DAYS,
    sent,
    delivered,
    bounced,
    complained,
    delayed,
    bounceRate: attempted > 0 ? round((bounced / attempted) * 100) : 0,
    complaintRate: delivered > 0 ? round((complained / delivered) * 100) : 0,
  };
}

export async function getEmailHealth(): Promise<EmailHealth> {
  const [subscribers, events] = await Promise.all([getSubscriberStats(), getEventStats()]);
  return { subscribers, events };
}
