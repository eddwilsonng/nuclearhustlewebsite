import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getEmailHealth } from '@/lib/data/emailHealth';
import { StatRow } from '@/components/ui/StatRow';
import {
  DashboardBody,
  DashboardPageHeader,
  DashboardSection,
} from '@/components/dashboard/DashboardChrome';

export const metadata = {
  title: 'Email health - Nuclear Hustle',
};

export default async function AdminEmailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard');
  }

  const { subscribers, events } = await getEmailHealth();
  const count = (n: number) => n.toLocaleString('en-US');

  return (
    <>
      <DashboardPageHeader
        title="Email health"
        description="Subscriber list and Resend deliverability, without the Pro plan."
      />
      <DashboardBody>
        <DashboardSection title="Subscribers">
          <StatRow
            stats={[
              { label: 'Total', value: count(subscribers.total) },
              { label: 'Active', value: count(subscribers.active) },
              { label: 'Unsubscribed', value: count(subscribers.unsubscribed) },
            ]}
          />
        </DashboardSection>

        <DashboardSection title={events ? `Deliverability, last ${events.windowDays} days` : 'Deliverability'}>
          {events === null ? (
            <div className="border border-dashed border-rule px-5 py-6">
              <p className="max-w-prose font-sans text-sm leading-relaxed text-secondary">
                No event data yet. To record delivery, bounce and complaint events for free:
              </p>
              <ol className="mt-3 max-w-prose list-decimal space-y-1 pl-5 font-sans text-sm leading-relaxed text-secondary">
                <li>
                  Run <code className="font-mono text-xs text-ink">supabase/email-events-migration.sql</code> in
                  the Supabase SQL editor.
                </li>
                <li>
                  Add a webhook in Resend pointing at{' '}
                  <code className="font-mono text-xs text-ink">/api/webhooks/resend</code> and set{' '}
                  <code className="font-mono text-xs text-ink">RESEND_WEBHOOK_SECRET</code>.
                </li>
              </ol>
            </div>
          ) : (
            <>
              <StatRow
                stats={[
                  { label: 'Sent', value: count(events.sent) },
                  { label: 'Delivered', value: count(events.delivered) },
                  { label: 'Bounced', value: count(events.bounced) },
                  { label: 'Complaints', value: count(events.complained) },
                  { label: 'Delayed', value: count(events.delayed) },
                ]}
              />
              <StatRow
                className="mt-6"
                stats={[
                  {
                    label: 'Bounce rate',
                    value: `${events.bounceRate}%`,
                    detail: events.bounceRate >= 2 ? 'Above 2%: investigate' : 'Healthy, keep under 2%',
                  },
                  {
                    label: 'Complaint rate',
                    value: `${events.complaintRate}%`,
                    detail: events.complaintRate >= 0.1 ? 'Above 0.1%: investigate' : 'Healthy, keep under 0.1%',
                  },
                ]}
              />
            </>
          )}
        </DashboardSection>
      </DashboardBody>
    </>
  );
}
