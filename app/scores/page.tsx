import Link from "next/link";
import { Upload } from "lucide-react";
import {
  createExamAction,
  importScoresCsvAction,
  upsertScoreAction
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { formatDateVN } from "@/lib/dates";
import { average, formatScore, performanceBand } from "@/lib/metrics";
import { getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function ScoresPage() {
  const context = await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);

  const [{ data: students }, { data: profiles }, { data: exams }, { data: scores }] =
    await Promise.all([
      supabase.from("students").select("*").order("class_name").order("full_name"),
      supabase.from("profiles").select("id,username"),
      supabase.from("exams").select("*").order("date", { ascending: true }),
      supabase.from("scores").select("*")
    ]);

  const usernameByUser = new Map((profiles ?? []).map((profile) => [profile.id, profile.username]));
  const scoresByStudentExam = new Map(
    (scores ?? []).map((score) => [`${score.student_id}:${score.exam_id}`, score])
  );

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Score Management"
        title="Quản lý điểm số"
        description="Thêm cột bài kiểm tra, nhập điểm từng học sinh hoặc import CSV dạng username,score."
      />

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form action={createExamAction} className="surface grid gap-4 p-5 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="label">Tên bài</span>
            <input name="title" className="field" required />
          </label>
          <label className="space-y-1">
            <span className="label">Ngày</span>
            <input name="date" type="date" className="field" required />
          </label>
          <label className="space-y-1">
            <span className="label">Điểm tối đa</span>
            <input name="max_score" type="number" min="1" max="100" defaultValue={10} className="field" required />
          </label>
          <button className="btn-primary sm:col-span-3">Thêm cột điểm</button>
        </form>

        <form action={importScoresCsvAction} className="surface grid gap-4 p-5">
          <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
            <label className="space-y-1">
              <span className="label">Bài kiểm tra</span>
              <select name="exam_id" className="field" required>
                {(exams ?? []).map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="label">CSV</span>
              <textarea name="csv" rows={3} className="field" placeholder="hs_nguyenvana_7a,8.5" required />
            </label>
          </div>
          <button className="btn-secondary">
            <Upload className="h-4 w-4" aria-hidden />
            Import CSV
          </button>
        </form>
      </section>

      <section className="mt-6 table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Học sinh</th>
              <th>Lớp</th>
              {(exams ?? []).map((exam) => (
                <th key={exam.id}>
                  <span className="block">{exam.title}</span>
                  <span className="font-normal normal-case text-muted">{formatDateVN(exam.date)}</span>
                </th>
              ))}
              <th>TB</th>
              <th>Band</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(students ?? []).map((student) => {
              const studentScores = (scores ?? []).filter((score) => score.student_id === student.id);
              const avg = average(studentScores.map((score) => score.score));
              const band = performanceBand(avg);
              return (
                <tr key={student.id}>
                  <td className="min-w-[220px]">
                    <Link href={`/scores/${student.id}`} className="font-bold text-primary hover:underline">
                      {student.full_name}
                    </Link>
                    <p className="text-xs text-muted">{usernameByUser.get(student.user_id)}</p>
                  </td>
                  <td>{student.class_name}</td>
                  {(exams ?? []).map((exam) => {
                    const current = scoresByStudentExam.get(`${student.id}:${exam.id}`);
                    return (
                      <td key={exam.id} className="min-w-[145px]">
                        <form action={upsertScoreAction} className="flex gap-2">
                          <input type="hidden" name="student_id" value={student.id} />
                          <input type="hidden" name="exam_id" value={exam.id} />
                          <input
                            name="score"
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            defaultValue={current?.score ?? ""}
                            className="field w-20"
                            required
                          />
                          <button className="btn-secondary px-3">Lưu</button>
                        </form>
                      </td>
                    );
                  })}
                  <td className="font-bold">{formatScore(avg)}</td>
                  <td>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${band.className}`}>
                      {band.en}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
