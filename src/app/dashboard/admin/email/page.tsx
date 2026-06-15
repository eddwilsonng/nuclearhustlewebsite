import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { getEmailHealth } from '@/lib/data/emailHealth';

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs font-mono tracking-widest uppercase text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-400 font-mono mt-1">{hint}</p>}
    </div>
  );
}

export default async function AdminEmailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect('/dashboard');
  }

  const { subscribers, events } = await getEmailHealth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Email Health</h1>
      <p className="text-sm text-gray-500 mb-8 font-mono">
        Subscriber list and Resend deliverability — no Pro plan required
      </p>

      <h2 className="text-sm font-mono tracking-widest uppercase text-gray-500 mb-3">Subscribers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Total" value={subscribers.total} />
        <StatCard label="Active" value={subscribers.active} />
        <StatCard label="Unsubscribed" value={subscribers.unsubscribed} />
      </div>

      <h2 className="text-sm font-mono tracking-widest uppercase text-gray-500 mb-3">
        Deliverability {events ? `(last ${events.windowDays}d)` : ''}
      </h2>

      {events === null ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-500 font-mono leading-relaxed">
            No event data yet. To capture delivery, bounce, and complaint events for free:
          </p>
          <ol className="text-sm text-gray-500 font-mono leading-relaxed list-decimal pl-5 mt-3 space-y-1">
            <li>
              Run <code className="text-gray-700">supabase/email-events-migration.sql</code> in the
              Supabase SQL editor.
            </li>
            <li>
              Add a webhook in Resend pointing at{' '}
              <code className="text-gray-700">/api/webhooks/resend</code> and set{' '}
              <code className="text-gray-700">RESEND_WEBHOOK_SECRET</code>.
            </li>
          </ol>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard label="Sent" value={events.sent} />
            <StatCard label="Delivered" value={events.delivered} />
            <StatCard label="Bounced" value={events.bounced} />
            <StatCard label="Complaints" value={events.complained} />
            <StatCard label="Delayed" value={events.delayed} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              label="Bounce Rate"
              value={`${events.bounceRate}%`}
              hint={events.bounceRate >= 2 ? 'Above 2% — investigate' : 'Healthy (keep under 2%)'}
            />
            <StatCard
              label="Complaint Rate"
              value={`${events.complaintRate}%`}
              hint={events.complaintRate >= 0.1 ? 'Above 0.1% — investigate' : 'Healthy (keep under 0.1%)'}
            />
          </div>
        </>
      )}
    </div>
  );
}
