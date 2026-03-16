import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const jobId = formData.get('jobId') as string;
    const applicantName = formData.get('applicantName') as string;
    const applicantEmail = formData.get('applicantEmail') as string;
    const message = formData.get('message') as string | null;
    const cvFile = formData.get('cv') as File | null;

    if (!jobId || !applicantName || !applicantEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!cvFile || cvFile.size === 0) {
      return NextResponse.json({ error: 'A CV or resume is required' }, { status: 400 });
    }

    // Look up the job and its application email (server-side only)
    const supabase = await createClient();
    const { data: job, error: jobError } = await supabase
      .from('employer_jobs')
      .select('id, title, slug, application_type, application_email, employer:employer_profiles(company_name)')
      .eq('slug', jobId)
      .eq('is_active', true)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.application_type !== 'form' || !job.application_email) {
      return NextResponse.json({ error: 'This job does not accept form applications' }, { status: 400 });
    }

    // Upload CV to Supabase storage if provided
    let cvUrl: string | null = null;
    if (cvFile && cvFile.size > 0) {
      if (cvFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'CV must be less than 5MB' }, { status: 400 });
      }

      const fileExt = cvFile.name.split('.').pop();
      const fileName = `applications/${job.id}/${Date.now()}-${applicantName.replace(/\s+/g, '-')}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, cvFile, { cacheControl: '3600', upsert: false });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName);
        cvUrl = publicUrl;
      }
    }

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const companyName = Array.isArray(job.employer) ? job.employer[0]?.company_name : (job.employer as { company_name: string } | null)?.company_name ?? 'your company';

      await resend.emails.send({
        from: 'Nuclear Hustle <applications@nuclearhustle.com>',
        to: job.application_email,
        replyTo: applicantEmail,
        subject: `New application: ${job.title}`,
        html: `
          <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 24px;">
            <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 4px;">Nuclear Hustle</p>
            <h1 style="font-size: 20px; font-weight: bold; color: #111; margin: 0 0 24px;">New Application — ${job.title}</h1>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999; width: 120px;">Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111; font-weight: bold;">${applicantName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${applicantEmail}" style="color: #d97706;">${applicantEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999;">Position</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111;">${job.title}</td>
              </tr>
              ${cvUrl ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #999;">CV</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;"><a href="${cvUrl}" style="color: #d97706;">Download CV →</a></td>
              </tr>` : ''}
            </table>

            ${message ? `
            <div style="margin-top: 24px;">
              <p style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 8px;">Cover Letter</p>
              <p style="font-size: 13px; color: #444; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>` : ''}

            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
              <p style="font-size: 11px; color: #bbb;">Sent via <a href="https://nuclearhustle.com" style="color: #bbb;">Nuclear Hustle</a>. Reply directly to this email to contact the applicant.</p>
            </div>
          </div>
        `,
      });
    } else {
      // Dev fallback — log to console
      console.log('[apply] New application:', {
        job: job.title,
        to: job.application_email,
        from: applicantEmail,
        name: applicantName,
        cvUrl,
        message,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[apply] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
