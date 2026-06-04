import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

const allowedBuckets = new Set([
  "announcements",
  "homework",
  "documents",
  "homework-submissions"
]);

export async function GET(
  request: NextRequest,
  { params }: { params: { bucket: string; path: string[] } }
) {
  const response = NextResponse.next();
  const supabase = createSupabaseRouteClient(request, response);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!allowedBuckets.has(params.bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
  }

  const path = params.path.join("/");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(params.bucket)
    .createSignedUrl(path, 60);

  if (error || !data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
