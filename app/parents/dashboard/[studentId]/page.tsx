import { redirect } from "next/navigation";
import { ParentShell } from "@/components/app-shell";
import { ScoreLineChart } from "@/components/charts";
import { PageHeader } from "@/components/page-header";
import { StudentEvaluationCard } from "@/components/student-evaluation-card";
import { StudentProfileCard } from "@/components/student-profile-card";
import { requireParent } from "@/lib/auth";
import { formatDateVN } from "@/lib/dates";
import { formatScore } from "@/lib/metrics";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function ParentStudentDetailPage({
  params
}: {
  params: { studentId: string };
}) {
  const context = await requireParent();
  const supabase = createSupabaseAdminClient();
  const grade = context.parent!.grade;

  const [
    { data: student },
    { data: scores },
    { data: badges },
    { data: comments }
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*")
      .eq("id", params.studentId)
      .eq("grade", grade)
      .single(),
    supabase
      .from("scores")
      .select("*, exams(id,title,date,max_score)")
      .eq("student_id", params.studentId)
      .order("created_at", { ascending: true }),
    supabase.from("badges").select("*").eq("student_id", params.studentId),
    supabase
      .from("teacher_comments")
      .select("*")
      .eq("student_id", params.studentId)
      .order("created_at", { ascending: false })
  ]);

  if (!student) redirect("/parents/dashboard");

  const chartData = (scores ?? []).map((score) => ({
    label: score.exams?.title ?? formatDateVN(score.created_at),
    score: score.score
  }));

  return (
    <ParentShell context={context}>
      <PageHeader
        eyebrow="Student Detail"
        title={student.full_name}
        description="Phụ huynh xem lịch sử điểm, band năng lực, nhận xét giáo viên và huy hiệu."
      />

      <StudentProfileCard
        student={student}
        scores={scores ?? []}
        badges={badges ?? []}
        latestComment={comments?.[0] ?? null}
      />

      <StudentEvaluationCard scores={scores ?? []} />

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="surface p-5">
          <h3 className="section-title">Biểu đồ điểm</h3>
          <div className="mt-4">
            {chartData.length ? <ScoreLineChart data={chartData} /> : <p className="muted">Chưa có điểm.</p>}
          </div>
        </div>
        <div className="surface p-5">
          <h3 className="section-title">Nhận xét</h3>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(scores ?? []).map((score) => (
              <tr key={score.id}>
                <td className="font-semibold">{score.exams?.title ?? "Bài kiểm tra"}</td>
                <td>{formatDateVN(score.exams?.date ?? score.created_at)}</td>
                <td>{formatScore(score.score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </ParentShell>
  );
}
