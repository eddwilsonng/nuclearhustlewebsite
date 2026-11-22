import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { safeInternalPath, withRedirect } from "@/lib/redirects";
import { provisionAccount } from "@/lib/auth/provision";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role");
  const nextParam = safeInternalPath(searchParams.get("next"));
  const next = nextParam ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // Password recovery lands here too. Send it straight on, before any
    // onboarding check can divert it.
    if (!error && next === "/reset-password") {
      return NextResponse.redirect(`${origin}/reset-password`);
    }

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // `role` is only set when the person came from a signup page, where
        // the Google button stays disabled until the terms box is ticked.
        const result = await provisionAccount(user, {
          role: role === "employer" || role === "job_seeker" ? role : undefined,
          acceptedTerms: role === "employer" || role === "job_seeker",
        });

        if (result.error) {
          return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("We couldn't finish setting up your account. Try again.")}`);
        }
        if (!result.role) {
          return NextResponse.redirect(`${origin}${withRedirect("/onboarding", nextParam)}`);
        }
        if (result.role === "employer" && !result.hasCompany) {
          return NextResponse.redirect(`${origin}${withRedirect("/onboarding/company", nextParam ?? "/dashboard/jobs/new")}`);
        }
        if (result.role === "job_seeker" && result.created) {
          return NextResponse.redirect(`${origin}${withRedirect("/onboarding/profile", nextParam)}`);
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
