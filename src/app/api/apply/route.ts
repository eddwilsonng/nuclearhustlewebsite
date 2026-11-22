import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';
import { applicationConfirmationEmail } from '@/lib/email/templates/accountEmails';

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

// The apex and www hosts both serve the site, so accept either regardless of
// which one NEXT_PUBLIC_SITE_URL is set to.
function getAllowedOrigins(): Set<string> {
  const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  const apexHost = siteUrl.host.replace(/^www\./, '');
  return new Set([
    `${siteUrl.protocol}//${apexHost}`,
    `${siteUrl.protocol}//www.${apexHost}`,
  ]);
}

function isAllowedOrigin(url: string): boolean {
  try {
    return getAllowedOrigins().has(new URL(url).origin);
  } catch {
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

    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!origin && referer && !isAllowedOrigin(referer)) {
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

    // Signed-in job seekers can send the resume stored on their profile, and
    // their application is linked to the account for "My applications".
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const useStoredResume = formData.get('cvSource') === 'stored' && Boolean(user);
    const cvFile = formData.get('cv') as File | null;
    let fileExt = '';

    if (!useStoredResume) {
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

      fileExt = cvFile.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_CV_EXTENSIONS.includes(fileExt)) {
        return NextResponse.json({ error: 'Only .pdf, .doc, and .docx files are allowed' }, { status: 400 });
      }
    }

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

    if (formData.get('acceptedTerms') !== 'on') {
      return NextResponse.json(
        { error: 'Accept the terms to send this application' },
        { status: 400 },
      );
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

    const { data: seeker } = user
      ? await admin
          .from('job_seeker_profiles')
          .select('resume_url, phone')
          .eq('user_id', user.id)
          .maybeSingle()
      : { data: null };

    if (useStoredResume) {
      const storedPath =
        seeker?.resume_url && !seeker.resume_url.startsWith('http') ? (seeker.resume_url as string) : null;
      if (!storedPath) {
        return NextResponse.json(
          { error: "There's no resume on your profile. Upload one with this application." },
          { status: 400 },
        );
      }
      // A copy, not a reference: replacing your profile resume later must not
      // change what this employer received.
      const storedExt = storedPath.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `applications/${job.id}/${Date.now()}-${safeName}.${storedExt}`;
      const { error: copyError } = await admin.storage.from('resumes').copy(storedPath, fileName);
      if (copyError) {
        console.error('[apply] Could not copy stored resume:', copyError.message);
        return NextResponse.json(
          { error: "We couldn't attach your stored resume. Upload the file with this application instead." },
          { status: 500 },
        );
      }
      cvPath = fileName;
    } else if (cvFile) {
      const fileName = `applications/${job.id}/${Date.now()}-${safeName}.${fileExt}`;
      const { error: uploadError } = await admin.storage
        .from('resumes')
        .upload(fileName, cvFile, { cacheControl: '3600', upsert: false });
      if (!uploadError) cvPath = fileName;
    }

    if (cvPath) {
      // Short-lived signed URL just for the notification email
      const { data: signedData } = await admin.storage
        .from('resumes')
        .createSignedUrl(cvPath, 60 * 60 * 24);
      cvUrl = signedData?.signedUrl ?? null;
    }

    // Persist the application so it shows in the recruiter dashboard
    const application = {
      job_id: job.id,
      employer_id: job.employer_id,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      message: message || null,
      cv_path: cvPath,
    };
    let { error: insertError } = await admin
      .from('job_applications')
      .insert(user ? { ...application, applicant_user_id: user.id } : application);
    if (insertError && user && /applicant_user_id/.test(insertError.message)) {
      // supabase/onboarding-migration.sql not run yet: still deliver the application.
      ({ error: insertError } = await admin.from('job_applications').insert(application));
    }

    if (insertError) {
      console.error('[apply] Failed to persist application:', insertError.message);
      return NextResponse.json({ error: 'Could not save application' }, { status: 500 });
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
      const ePhone = seeker?.phone ? escapeHtml(seeker.phone as string) : null;

      const { error: sendError } = await resend.emails.send({
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
              ${ePhone ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999;">Phone</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111;">${ePhone}</td>
              </tr>` : ''}
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
              <p style="font-size: 11px; color: #bbb;">Sent via <a href="https://www.nuclearhustle.com" style="color: #bbb;">Nuclear Hustle</a>. Reply directly to this email to contact the applicant.</p>
            </div>
          </div>
        `,
      });
      if (sendError) {
        console.error('[apply] Failed to send notification:', sendError.message);
        return NextResponse.json(
          { error: 'Application saved, but the notification email failed' },
          { status: 502 },
        );
      }

      // Confirmation to the applicant. Best effort: the application is
      // already delivered, so a failure here doesn't fail the request.
      const confirmation = applicationConfirmationEmail({
        applicantName,
        jobTitle: job.title,
        companyName: companyName ?? 'The employer',
        jobSlug: job.slug,
        hasAccount: Boolean(user),
      });
      const { error: confirmError } = await resend.emails.send({
        from: 'Nuclear Hustle <applications@nuclearhustle.com>',
        to: applicantEmail,
        // Not the employer's inbox: listings keep application_email private.
        replyTo: 'nuclearhustle@gmail.com',
        subject: confirmation.subject,
        html: confirmation.html,
        text: confirmation.text,
      });
      if (confirmError) console.error('[apply] Applicant confirmation failed:', confirmError.message);
    } else {
      console.error('[apply] RESEND_API_KEY not set. Application saved for job:', job.id);
      return NextResponse.json(
        { error: 'Application saved, but the notification email failed' },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[apply] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
