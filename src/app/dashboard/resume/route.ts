import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function resumeStoragePath(stored: string | null): string | null {
  if (!stored) return null;
  if (!stored.startsWith("http")) return stored;
  const match = stored.match(/\/resumes\/(.+?)(?:\?|$)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Opens the signed-in job seeker's own resume. A plain link to this route
 * replaces window.open-after-await, which popup blockers stop.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?redirect=/dashboard/profile", request.url));

  const { data: profile } = await supabase
    .from("job_seeker_profiles")
    .select("resume_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const path = resumeStoragePath(profile?.resume_url ?? null);
  if (!path) return new NextResponse("No resume on file.", { status: 404 });

  const { data: signed } = await createAdminClient().storage.from("resumes").createSignedUrl(path, 60 * 5);
  if (!signed) return new NextResponse("Could not open the resume. Try again.", { status: 502 });

  return NextResponse.redirect(signed.signedUrl);
}
