import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppContext, Role } from "@/lib/types";

export function roleHome(role: Role, studentId?: string) {
  if (role === "admin") return "/admin";
  if (role === "parent") return "/parents/dashboard";
  return studentId ? `/student` : "/announcements";
}

export async function getCurrentUser(): Promise<AppContext | null> {
  const supabase = createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const [studentResult, parentResult] = await Promise.all([
    profile.role === "student"
      ? admin.from("students").select("*").eq("user_id", user.id).single()
      : Promise.resolve({ data: null }),
    profile.role === "parent"
      ? admin.from("parents").select("*").eq("user_id", user.id).single()
      : Promise.resolve({ data: null })
  ]);

  return {
    profile,
    student: studentResult.data,
    parent: parentResult.data
  };
}

export async function requireCurrentUser(roles?: Role[]) {
  const context = await getCurrentUser();

  if (!context) {
    redirect("/login");
  }

  if (roles && !roles.includes(context.profile.role)) {
    redirect(roleHome(context.profile.role, context.student?.id));
  }

  return context;
}

export async function requireAdmin() {
  return requireCurrentUser(["admin"]);
}

export async function requireSchoolUser() {
  return requireCurrentUser(["admin", "student"]);
}

export async function requireParent() {
  return requireCurrentUser(["parent"]);
}

export async function assertAdminAction() {
  const context = await getCurrentUser();
  if (!context || context.profile.role !== "admin") {
    throw new Error("Bạn không có quyền thực hiện thao tác này.");
  }
  return context;
}

export async function assertStudentAction() {
  const context = await getCurrentUser();
  if (!context || context.profile.role !== "student" || !context.student) {
    throw new Error("Chỉ học sinh mới được thực hiện thao tác này.");
  }
  return context;
}
