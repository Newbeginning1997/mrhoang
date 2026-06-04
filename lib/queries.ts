import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppContext } from "@/lib/types";

export async function getPendingHomeworkCount(context: AppContext) {
  const supabase = createSupabaseAdminClient();

  if (context.profile.role === "admin") {
    const { count } = await supabase
      .from("homework_submissions")
      .select("id", { count: "exact", head: true })
      .is("score", null);
    return count ?? 0;
  }

  if (context.profile.role === "student" && context.student) {
    const [{ data: homework }, { data: submissions }] = await Promise.all([
      supabase.from("homework").select("id"),
      supabase
        .from("homework_submissions")
        .select("homework_id")
        .eq("student_id", context.student.id)
    ]);
    const submitted = new Set((submissions ?? []).map((row) => row.homework_id));
    return (homework ?? []).filter((item) => !submitted.has(item.id)).length;
  }

  return 0;
}

export function fileDownloadPath(bucket: string, path?: string | null) {
  if (!path) return null;
  return `/api/files/${bucket}/${path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export function bytesToLabel(bytes?: number | null) {
  if (!bytes) return "Không rõ";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
