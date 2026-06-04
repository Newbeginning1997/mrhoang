import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { average } from "@/lib/metrics";
import type { BadgeKey, Score, Student } from "@/lib/types";

function monthsSince(value: string) {
  const start = new Date(value);
  const now = new Date();
  return (
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) -
    (now.getDate() < start.getDate() ? 1 : 0)
  );
}

function isSameWeek(dateA: Date, dateB: Date) {
  const startOfWeek = (date: Date) => {
    const copy = new Date(date);
    const day = copy.getDay() || 7;
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - day + 1);
    return copy;
  };

  return startOfWeek(dateA).getTime() === startOfWeek(dateB).getTime();
}

export async function syncBadgesForStudent(studentId: string) {
  const supabase = createSupabaseAdminClient();

  const [{ data: student }, { data: scores }, { data: submissions }, { data: allStudents }] =
    await Promise.all([
      supabase.from("students").select("*").eq("id", studentId).single(),
      supabase
        .from("scores")
        .select("*, exams(id,title,date,max_score)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true }),
      supabase
        .from("homework_submissions")
        .select("submitted_at, homework(due_date)")
        .eq("student_id", studentId)
        .order("submitted_at", { ascending: false }),
      supabase.from("students").select("*, scores(score)")
    ]);

  if (!student) return;

  const badgeKeys = deriveBadges({
    student,
    scores: scores ?? [],
    submissions: (submissions ?? []).map((submission) => ({
      submitted_at: submission.submitted_at,
      homework: Array.isArray(submission.homework)
        ? submission.homework[0] ?? null
        : submission.homework ?? null
    })),
    allStudents: allStudents ?? []
  });

  if (!badgeKeys.length) return;

  await supabase.from("badges").upsert(
    badgeKeys.map((badge_key) => ({
      student_id: studentId,
      badge_key
    })),
    { onConflict: "student_id,badge_key" }
  );
}

export function deriveBadges({
  student,
  scores,
  submissions,
  allStudents
}: {
  student: Student;
  scores: Score[];
  submissions: Array<{ submitted_at: string; homework?: { due_date: string } | null }>;
  allStudents: Array<Student & { scores?: Array<{ score: number }> }>;
}) {
  const badges = new Set<BadgeKey>();
  const avg = average(scores.map((score) => score.score));
  const tenureMonths = monthsSince(student.enrollment_date);

  // Quy tắc huy hiệu thâm niên: tự động mở khi đủ mốc học.
  if (tenureMonths >= 3) badges.add("tenure_3_months");
  if (tenureMonths >= 6) badges.add("tenure_6_months");
  if (tenureMonths >= 12) badges.add("tenure_1_year");

  if ((avg ?? 0) >= 9) badges.add("excellent_student");

  // Quy tắc chuyên cần: 10 bài gần nhất đều nộp đúng hạn.
  const recentSubmissions = submissions.slice(0, 10);
  if (
    recentSubmissions.length === 10 &&
    recentSubmissions.every((submission) => {
      const dueDate = submission.homework?.due_date;
      return dueDate && new Date(submission.submitted_at) <= new Date(dueDate);
    })
  ) {
    badges.add("punctual_10");
  }

  // Quy tắc Top 5: xếp hạng theo điểm trung bình toàn lớp.
  const ranked = allStudents
    .map((row) => ({
      id: row.id,
      avg: average((row.scores ?? []).map((score) => score.score)) ?? -1
    }))
    .sort((a, b) => b.avg - a.avg);
  if (ranked.findIndex((row) => row.id === student.id) >= 0 && ranked.findIndex((row) => row.id === student.id) < 5) {
    badges.add("top_5");
  }

  // Quy tắc cải thiện: trung bình nửa sau tăng ít nhất 20% so với nửa trước.
  if (scores.length >= 4) {
    const midpoint = Math.floor(scores.length / 2);
    const previous = average(scores.slice(0, midpoint).map((score) => score.score));
    const latest = average(scores.slice(midpoint).map((score) => score.score));

    if (previous && latest && latest >= previous * 1.2) {
      badges.add("improved_20");
    }
  }

  // Quy tắc điểm cao nhất tuần: học sinh có bài kiểm tra tuần hiện tại từ 9 điểm trở lên.
  const now = new Date();
  if (
    scores.some((score) => {
      const examDate = score.exams?.date ? new Date(score.exams.date) : new Date(score.created_at);
      return isSameWeek(examDate, now) && score.score >= 9;
    })
  ) {
    badges.add("top_score_week");
  }

  return [...badges];
}
