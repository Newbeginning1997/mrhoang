import Link from "next/link";
import { ClassAverageChart, DistributionChart } from "@/components/charts";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { average, formatScore, performanceBand, studentAverage } from "@/lib/metrics";
import { getPendingHomeworkCount } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function distribution(values: number[]) {
  const ranges = [
    { label: "<5", count: 0, test: (value: number) => value < 5 },
    { label: "5-6.4", count: 0, test: (value: number) => value >= 5 && value < 6.5 },
    { label: "6.5-7.9", count: 0, test: (value: number) => value >= 6.5 && value < 8 },
    { label: "8-10", count: 0, test: (value: number) => value >= 8 }
  ];
  values.forEach((value) => ranges.find((range) => range.test(value))!.count++);
  return ranges.map(({ label, count }) => ({ label, count }));
}

export default async function StatisticsPage() {
  const context = await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const pendingCount = await getPendingHomeworkCount(context);

  const [{ data: students }, { data: exams }, { data: scores }] = await Promise.all([
    supabase.from("students").select("*").order("full_name"),
    supabase.from("exams").select("*").order("date", { ascending: true }),
    supabase.from("scores").select("*")
  ]);

  const latestExam = exams?.[exams.length - 1];
  const latestScores = latestExam
    ? (scores ?? []).filter((score) => score.exam_id === latestExam.id).map((score) => score.score)
    : [];

  const classAverageByExam = (exams ?? []).map((exam) => ({
    label: exam.title,
    average: Number(
      (average((scores ?? []).filter((score) => score.exam_id === exam.id).map((score) => score.score)) ?? 0).toFixed(2)
    )
  }));

  const ranked = (students ?? [])
    .map((student) => {
      const studentScores = (scores ?? []).filter((score) => score.student_id === student.id);
      return {
        student,
        scores: studentScores,
        avg: studentAverage(studentScores)
      };
    })
    .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

  const bandRows = ["beginner", "pre_intermediate", "intermediate", "upper_intermediate"].map((key) => ({
    key,
    count: ranked.filter((row) => performanceBand(row.avg).key === key).length
  }));

  return (
    <AppShell context={context} pendingCount={pendingCount}>
      <PageHeader
        eyebrow="Statistics"
        title="Thống kê lớp học"
        description="Phân phối điểm, trung bình lớp theo thời gian, xếp hạng và band năng lực."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h3 className="section-title">Phân phối điểm {latestExam ? latestExam.title : ""}</h3>
          <DistributionChart data={distribution(latestScores)} />
        </div>
        <div className="surface p-5">
          <h3 className="section-title">Điểm trung bình lớp</h3>
          <ClassAverageChart data={classAverageByExam} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Học sinh</th>
                <th>Lớp</th>
                <th>Điểm TB</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranked.map((row, index) => {
                const band = performanceBand(row.avg);
                return (
                  <tr key={row.student.id} className={index < 5 ? "bg-lagoon/5" : index >= ranked.length - 5 ? "bg-rose/5" : ""}>
                    <td className="font-bold">#{index + 1}</td>
                    <td>
                      <Link href={`/scores/${row.student.id}`} className="font-semibold text-primary hover:underline">
                        {row.student.full_name}
                      </Link>
                    </td>
                    <td>{row.student.class_name}</td>
                    <td>{formatScore(row.avg)}</td>
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
        </div>

        <div className="surface p-5">
          <h3 className="section-title">Band breakdown</h3>
          <div className="mt-4 space-y-3">
            {bandRows.map((row) => {
              const label = {
                beginner: "Beginner",
                pre_intermediate: "Pre-Intermediate",
                intermediate: "Intermediate",
                upper_intermediate: "Upper-Intermediate"
              }[row.key];
              return (
                <div key={row.key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <span className="font-semibold text-ink">{label}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{row.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
