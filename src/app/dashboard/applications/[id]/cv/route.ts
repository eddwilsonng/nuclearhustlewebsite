import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Opens an applicant's CV for the employer who received the application.
 * Ownership is checked with the user-scoped client (RLS plus an explicit
 * employer match), then the service role signs a 5-minute link. A new
 * application moves to Reviewed when its CV is opened.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?redirect=/dashboard/applicants", request.url));

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!employer) return new NextResponse("Not found.", { status: 404 });

  const { data: application } = await supabase
    .from("job_applications")
    .select("cv_path, status")
    .eq("id", id)
    .eq("employer_id", employer.id)
    .maybeSingle();
  if (!application?.cv_path) return new NextResponse("This applicant didn't attach a CV.", { status: 404 });

  const { data: signed } = await createAdminClient()
    .storage.from("resumes")
    .createSignedUrl(application.cv_path, 60 * 5);
  if (!signed) return new NextResponse("Could not open the CV. Try again.", { status: 502 });

  // Opening the CV counts as reviewing it, so the applicant sees "Reviewed"
  // and the inbox stops counting it as new.
  if (application.status === "new") {
    await supabase
      .from("job_applications")
      .update({ status: "reviewed" })
      .eq("id", id)
      .eq("employer_id", employer.id);
  }

  return NextResponse.redirect(signed.signedUrl);
}
