import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import type { Role } from "@/lib/types";

const publicRoutes = ["/login", "/parents"];
const parentOnlyPrefix = "/parents/dashboard";
const adminOnlyPrefixes = ["/admin", "/scores", "/statistics"];
const schoolOnlyPrefixes = [
  "/student",
  "/announcements",
  "/homework",
  "/documents",
  "/calendar",
  "/quiz"
];

function isAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

function homeFor(role: Role, studentId?: string) {
  if (role === "admin") return "/admin";
  if (role === "parent") return "/parents/dashboard";
  return studentId ? "/student" : "/announcements";
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const pathname = request.nextUrl.pathname;

  if (isAsset(pathname) || pathname.startsWith("/api/auth") || pathname.startsWith("/api/files")) {
    return response;
  }

  const isPublic =
    publicRoutes.includes(pathname) ||
    pathname === "/";

  const hasSupabaseEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!hasSupabaseEnv) {
    if (isPublic) return response;

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = pathname.startsWith("/parents") ? "/parents" : "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (isPublic) return response;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = pathname.startsWith("/parents") ? "/parents" : "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  const role = profile.role as Role;

  if (pathname === "/login" || pathname === "/parents" || pathname === "/") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = homeFor(role);
    return NextResponse.redirect(homeUrl);
  }

  if (role === "parent") {
    if (!pathname.startsWith(parentOnlyPrefix)) {
      const parentUrl = request.nextUrl.clone();
      parentUrl.pathname = "/parents/dashboard";
      return NextResponse.redirect(parentUrl);
    }
    return response;
  }

  if (pathname.startsWith("/parents")) {
    const schoolUrl = request.nextUrl.clone();
    schoolUrl.pathname = homeFor(role);
    return NextResponse.redirect(schoolUrl);
  }

  if (
    role !== "admin" &&
    adminOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    const studentUrl = request.nextUrl.clone();
    studentUrl.pathname = "/student";
    return NextResponse.redirect(studentUrl);
  }

  if (
    role === "student" &&
    !schoolOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))
  ) {
    const studentUrl = request.nextUrl.clone();
    studentUrl.pathname = "/student";
    return NextResponse.redirect(studentUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
