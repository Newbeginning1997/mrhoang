import { redirect } from "next/navigation";
import { createTeacherCommentAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { ScoreLineChart } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { StudentEvaluationCard } from "@/components/student-evaluation-card";
import { StudentProfileCard } from "@/components/student-profile-card";
import { requireCurrentUser } from "@/lib/auth";
import { formatDateVN } from "@/lib/dates";
import { formatScore, performanceBand, studentAverage } from "@/lib/metrics";
import { getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function StudentReportPage({
  params
}: {
  params: { studentId: string };
}) {
  const context = await requireCurrentUser(["admin", "student"]);

  if (context.profile.role === "student" && context.student?.id !== params.studentId) {
    redirect("/student");
  }

  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);

  const [
    { data: student },
    { data: scores },
    { data: badges },
    { data: comments },
    { data: submissions },
    { data: homework }
  ] = await Promise.all([
    supabase.from("students").select("*").eq("id", params.studentId).single(),
    supabase
      .from("scores")
      .select("*, exams(id,title,date,max_score)")
      .eq("student_id", params.studentId)
      .order("created_at", { ascending: true }),
    supabase.from("badges").select("*").eq("student_id", params.studentId).order("awarded_at", { ascending: false }),
    supabase
      .from("teacher_comments")
      .select("*")
      .eq("student_id", params.studentId)
      .order("created_at", { ascending: false }),
    supabase.from("homework_submissions").select("id,submitted_at").eq("student_id", params.studentId),
    supabase.from("homework").select("id,created_at")
  ]);

  if (!student) redirect("/student");

  const avg = studentAverage(scores ?? []);
  const band = performanceBand(avg);
  const chartData = (scores ?? []).map((score) => ({
    label: score.exams?.title ?? formatDateVN(score.created_at),
    score: score.score
  }));

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Student Report"
        title={`Hồ sơ học tập: ${student.full_name}`}
        description="Lịch sử điểm, biểu đồ tiến bộ, nhận xét giáo viên và huy hiệu đạt được."
      />

      <StudentProfileCard
        student={student}
        scores={scores ?? []}
        badges={badges ?? []}
        latestComment={comments?.[0] ?? null}
        completedThisMonth={submissions?.length ?? 0}
        totalThisMonth={homework?.length ?? 0}
      />

      <StudentEvaluationCard scores={scores ?? []} />

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="section-title">Tiến bộ điểm số</h3>
              <p className="muted">
                Điểm trung bình {formatScore(avg)} · {band.vi} / {band.en}
              </p>
            </div>
          </div>
          {chartData.length ? (
            <ScoreLineChart data={chartData} />
          ) : (
            <p className="muted">Chưa có điểm để vẽ biểu đồ.</p>
          )}
        </div>

        <div className="surface p-5">
          <h3 className="section-title">Nhận xét giáo viên</h3>
          {context.profile.role === "admin" ? (
            <form action={createTeacherCommentAction} className="mt-4 space-y-3">
              <input type="hidden" name="student_id" value={student.id} />
              <textarea name="content" rows={4} className="field" placeholder="Nhận xét mới" required />
              <button className="btn-primary w-full">Lưu nhận xét</button>
            </form>
          ) : null}
          <div className="mt-4 space-y-3">
            {(comments ?? []).map((comment) => (
              <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm leading-6 text-ink">{comment.content}</p>
                <p className="mt-2 text-xs text-muted">{formatDateVN(comment.created_at)}</p>
              </div>
            ))}
            {!comments?.length ? <p className="muted">Chưa có nhận xét.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-6 table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bài kiểm tra</th>
              <th>Ngày</th>
              <th>Điểm</th>
              <th>Tối đa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(scores ?? []).map((score) => (
              <tr key={score.id}>
                <td className="font-semibold">{score.exams?.title ?? "Bài kiểm tra"}</td>
                <td>{formatDateVN(score.exams?.date ?? score.created_at)}</td>
                <td>{formatScore(score.score)}</td>
                <td>{score.exams?.max_score ?? 10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
