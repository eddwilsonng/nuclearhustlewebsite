import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

const ALLOWED_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_CV_EXTENSIONS = ['pdf', 'doc', 'docx'];

const applySchema = z.object({
  jobId: z.string().min(1).max(200),
  applicantName: z.string().min(1).max(200),
  applicantEmail: z.string().email().max(320),
  message: z.string().max(5000).nullable(),
});

// Supabase-backed rate limiter — survives serverless cold starts
// Max 5 applications per IP per 10-minute window
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT_MAX = 5;

async function isRateLimited(ip: string): Promise<boolean> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();

    const { count } = await admin
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('key', `apply:${ip}`)
      .gte('created_at', windowStart);

    if ((count ?? 0) >= RATE_LIMIT_MAX) return true;

    await admin.from('rate_limits').insert({ key: `apply:${ip}` });
    return false;
  } catch {
    // If rate limit table doesn't exist yet, fail open (don't block legitimate users)
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';

    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many applications. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate origin
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const allowedOrigin = new URL(siteUrl).origin;

    if (origin && origin !== allowedOrigin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!origin && referer && !referer.startsWith(allowedOrigin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();

    const parsed = applySchema.safeParse({
      jobId: formData.get('jobId'),
      applicantName: formData.get('applicantName'),
      applicantEmail: formData.get('applicantEmail'),
      message: formData.get('message') || null,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { jobId, applicantName, applicantEmail, message } = parsed.data;
    const cvFile = formData.get('cv') as File | null;

    if (!cvFile || cvFile.size === 0) {
      return NextResponse.json({ error: 'A CV or resume is required' }, { status: 400 });
    }

    if (cvFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'CV must be less than 5MB' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_CV_TYPES.includes(cvFile.type)) {
      return NextResponse.json({ error: 'Only PDF and Word documents are allowed' }, { status: 400 });
    }

    const fileExt = cvFile.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_CV_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json({ error: 'Only .pdf, .doc, and .docx files are allowed' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: job, error: jobError } = await supabase
      .from('employer_jobs')
      .select('id, employer_id, title, slug, application_type, application_email, employer:employer_profiles(company_name)')
      .eq('slug', jobId)
      .eq('is_active', true)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.application_type !== 'form' || !job.application_email) {
      return NextResponse.json({ error: 'This job does not accept form applications' }, { status: 400 });
    }

    // Use the service-role client for storage + the application row. Applicants
    // are anonymous, so the user-scoped storage RLS policies don't apply to them.
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();

    // Upload CV with sanitized filename. We persist the storage PATH (not a
    // signed URL) so the recruiter dashboard can mint fresh links on demand.
    let cvPath: string | null = null;
    let cvUrl: string | null = null;
    const safeName = sanitizeFilename(applicantName);
    const fileName = `applications/${job.id}/${Date.now()}-${safeName}.${fileExt}`;

    const { error: uploadError } = await admin.storage
      .from('resumes')
      .upload(fileName, cvFile, { cacheControl: '3600', upsert: false });

    if (!uploadError) {
      cvPath = fileName;
      // Short-lived signed URL just for the notification email
      const { data: signedData } = await admin.storage
        .from('resumes')
        .createSignedUrl(fileName, 60 * 60 * 24);
      cvUrl = signedData?.signedUrl ?? null;
    }

    // Persist the application so it shows in the recruiter dashboard
    const { error: insertError } = await admin.from('job_applications').insert({
      job_id: job.id,
      employer_id: job.employer_id,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      message: message || null,
      cv_path: cvPath,
    });

    if (insertError) {
      console.error('[apply] Failed to persist application:', insertError.message);
    }

    // Send email with escaped values
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const companyName = Array.isArray(job.employer)
        ? job.employer[0]?.company_name
        : (job.employer as { company_name: string } | null)?.company_name ?? 'your company';

      const eName = escapeHtml(applicantName);
      const eEmail = escapeHtml(applicantEmail);
      const eTitle = escapeHtml(job.title);
      const eMessage = message ? escapeHtml(message) : null;
      const eCvUrl = cvUrl ? escapeHtml(cvUrl) : null;

      await resend.emails.send({
        from: 'Nuclear Hustle <applications@nuclearhustle.com>',
        to: job.application_email,
        replyTo: applicantEmail,
        subject: `New application: ${job.title}`,
        html: `
          <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px;">
            <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 4px;">Nuclear Hustle</p>
            <h1 style="font-size: 20px; font-weight: bold; color: #111; margin: 0 0 24px;">New Application &mdash; ${eTitle}</h1>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999; width: 120px;">Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-weight: bold;">${eName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${eEmail}" style="color: #d97706;">${eEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999;">Position</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111;">${eTitle}</td>
              </tr>
              ${eCvUrl ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999;">CV</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;"><a href="${eCvUrl}" style="color: #d97706;">Download CV &rarr;</a></td>
              </tr>` : ''}
            </table>

            ${eMessage ? `
            <div style="margin-top: 24px;">
              <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 8px;">Cover Letter</p>
              <p style="font-size: 13px; color: #444; line-height: 1.6; white-space: pre-wrap;">${eMessage}</p>
            </div>` : ''}

            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
              <p style="font-size: 11px; color: #bbb;">Sent via <a href="https://nuclearhustle.com" style="color: #bbb;">Nuclear Hustle</a>. Reply directly to this email to contact the applicant.</p>
            </div>
          </div>
        `,
      });
    } else {
      // No email provider configured — log only non-PII details
      console.warn('[apply] RESEND_API_KEY not set. Application received for job:', job.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[apply] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
