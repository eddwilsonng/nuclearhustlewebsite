import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role = searchParams.get("role");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if profile already exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single();

        if (!profile) {
          // New Google user — create profile based on role param
          const fullName =
            user.user_metadata?.full_name ||
            user.email!.split("@")[0];

          if (role === "job_seeker") {
            await supabase.from("profiles").insert({
              id: user.id,
              email: user.email!,
              full_name: fullName,
              role: "job_seeker",
            });
            await supabase.from("job_seeker_profiles").insert({
              user_id: user.id,
            });
            return NextResponse.redirect(`${origin}/dashboard`);
          } else if (role === "employer") {
            await supabase.from("profiles").insert({
              id: user.id,
              email: user.email!,
              full_name: fullName,
              role: "employer",
            });
            return NextResponse.redirect(`${origin}/onboarding/employer`);
          } else {
            // No role — send to onboarding to pick
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        }

        // Existing user — check if employer needs to complete company profile
        if (profile.role === "employer") {
          const { data: employerProfile } = await supabase
            .from("employer_profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (!employerProfile) {
            return NextResponse.redirect(`${origin}/onboarding/employer`);
          }
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
