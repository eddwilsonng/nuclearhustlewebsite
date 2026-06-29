import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import expiredSlugs from "@/data/expired-slugs.json";

// Slugs of jobs the hygiene process has marked expired. The page already 404s
// for these (publishedJobs() excludes status:'expired'); middleware upgrades
// that known subset to a 410 Gone with a branded body. Built once at module load.
type ExpiredEntry = { slug: string; state: string | null; category: string };
const expiredMap = new Map<string, ExpiredEntry>(
  (expiredSlugs as ExpiredEntry[]).map((e) => [e.slug, e])
);

function gonePage(entry: ExpiredEntry): string {
  const links: string[] = [];
  if (entry.state) {
    links.push(
      `<a href="/jobs/${entry.state}">More jobs in ${entry.state.replace(/-/g, " ")}</a>`
    );
  }
  if (entry.category && entry.category !== "other") {
    links.push(`<a href="/jobs/role/${entry.category}">More ${entry.category.replace(/-/g, " ")} jobs</a>`);
  }
  links.push(`<a href="/jobs">Browse all jobs</a>`);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Listing closed | Nuclear Hustle</title>
<style>
  body{margin:0;background:#EDE8DF;color:#1a1a1a;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;
       min-height:100vh;display:flex;align-items:center;justify-content:center}
  main{max-width:32rem;padding:2rem;text-align:center}
  .label{font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:#7a7264;margin-bottom:1rem}
  h1{font-size:1.5rem;font-weight:600;margin:0 0 .75rem}
  p{color:#5a5346;line-height:1.6;margin:0 0 2rem}
  nav{display:flex;flex-direction:column;gap:.5rem}
  a{display:block;border:1px solid #CFC8BC;padding:.75rem 1rem;color:#1a1a1a;text-decoration:none;
    background:#EDE8DF;transition:background .1s}
  a:hover{background:#E5DFD5}
</style></head>
<body><main>
  <div class="label">Listing closed</div>
  <h1>This job is no longer available</h1>
  <p>This position has been filled or removed by the employer. It's no longer accepting applications.</p>
  <nav>${links.join("")}</nav>
</main></body></html>`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Expired job pages → 410 Gone. Handled before any Supabase/auth work so job
  // pages stay fast and unauthenticated. Only exact /job/<slug> (one segment).
  if (pathname.startsWith("/job/")) {
    const parts = pathname.split("/").filter(Boolean); // ['job', '<slug>']
    if (parts.length === 2) {
      const entry = expiredMap.get(parts[1]);
      if (entry) {
        return new NextResponse(gonePage(entry), {
          status: 410,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if it exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard and onboarding routes
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/onboarding")
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages (not onboarding)
  if (
    user &&
    (request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/signup"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/job/:slug",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/signup/:path*",
  ],
};
