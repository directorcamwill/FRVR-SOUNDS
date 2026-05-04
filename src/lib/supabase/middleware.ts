import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const protectedPaths = [
    "/command-center",
    "/vault",
    "/pipeline",
    "/submissions",
    "/intelligence",
    "/health",
    "/settings",
    "/onboarding",
  ];

  // Redirect unauthenticated users away from protected routes
  if (!user && protectedPaths.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/command-center";
    return NextResponse.redirect(url);
  }

  // Force authenticated users through /onboarding before they can use the app.
  // Bypass when:
  //   - user is unauthenticated (handled above)
  //   - already on /onboarding (no loop)
  //   - hitting /api/* (so the onboarding form's own POST works)
  //   - hitting /pricing or /logout (let them browse plans / leave)
  //   - hitting Next internals (already filtered by matcher above, but safe)
  if (
    user &&
    !path.startsWith("/onboarding") &&
    !path.startsWith("/api") &&
    !path.startsWith("/pricing") &&
    !path.startsWith("/logout") &&
    !path.startsWith("/_next") &&
    path !== "/offline"
  ) {
    // Read the profile flag — failure (e.g. row missing) defaults to false so
    // brand-new users who haven't been provisioned still get pushed to onboarding.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
