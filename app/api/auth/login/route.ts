import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/route";
import type { Role } from "@/lib/types";

function redirectFor(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "parent") return "/parents/dashboard";
  return "/student";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const portal = body?.portal === "parent" ? "parent" : "school";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Vui lòng nhập tên đăng nhập và mật khẩu." },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id,email,role")
    .eq("username", username)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Thông tin đăng nhập không đúng." },
      { status: 401 }
    );
  }

  if (portal === "parent" && profile.role !== "parent") {
    return NextResponse.json(
      { error: "Tài khoản này không thuộc cổng phụ huynh." },
      { status: 403 }
    );
  }

  if (portal === "school" && profile.role === "parent") {
    return NextResponse.json(
      { error: "Phụ huynh vui lòng đăng nhập tại trang /parents." },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: redirectFor(profile.role)
  });
  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password
  });

  if (error) {
    return NextResponse.json(
      { error: "Thông tin đăng nhập không đúng." },
      { status: 401 }
    );
  }

  return response;
}
