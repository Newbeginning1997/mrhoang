import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Award } from "lucide-react";
import { ParentShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { requireParent } from "@/lib/auth";
import { formatDateVN } from "@/lib/dates";
import {
  formatScore,
  performanceBand,
  scoreTrend,
  studentAverage
} from "@/lib/metrics";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function ParentDashboardPage() {
  const context = await requireParent();
  const supabase = createSupabaseAdminClient();
  const grade = context.parent!.grade;

  const [{ data: students }, { data: scores }, { data: badges }, { data: events }] =
    await Promise.all([
      supabase.from("students").select("*").eq("grade", grade).order("class_name").order("full_name"),
      supabase.from("scores").select("*, exams(id,title,date,max_score)"),
      supabase.from("badges").select("*"),
      supabase
        .from("calendar_events")
        .select("*")
        .in("type", ["exam", "holiday", "special"])
        .gte("date", new Date().toISOString().slice(0, 10))
        .order("date", { ascending: true })
        .limit(5)
    ]);

  return (
    <ParentShell context={context}>
      <PageHeader
        eyebrow="Parent Dashboard"
        title={`Học sinh khối ${grade}`}
        description="Phụ huynh chỉ xem điểm, band năng lực, nhận xét và huy hiệu. Không có liên kết tới bài tập, tài liệu hoặc thông báo lớp."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(students ?? []).map((student) => {
          const studentScores = (scores ?? []).filter((score) => score.student_id === student.id);
          const studentBadges = (badges ?? []).filter((badge) => badge.student_id === student.id);
          const avg = studentAverage(studentScores);
          const band = performanceBand(avg);
          const trend = scoreTrend(studentScores);
          const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : ArrowRight;

          return (
            <Link key={student.id} href={`/parents/dashboard/${student.id}`} className="surface group block p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-ink">{student.full_name}</p>
                  <p className="mt-1 text-sm text-muted">Lớp {student.class_name}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white font-bold shadow-sm ring-4 ring-primary/10 transition group-hover:ring-primary/20">
                  {student.avatar_initials}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs text-muted">Điểm TB</p>
                  <p className="mt-1 text-xl font-bold text-ink">{formatScore(avg)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs text-muted">Xu hướng</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-ink">
                    <TrendIcon className="h-4 w-4" aria-hidden />
                    {trend === "up" ? "Tăng" : trend === "down" ? "Giảm" : "Ổn định"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${band.className}`}>
                  {band.en}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-sun/10 px-3 py-1 text-xs font-bold text-sun">
                  <Award className="h-3 w-3" aria-hidden />
                  {studentBadges.length} huy hiệu
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="surface mt-6 p-5">
        <h3 className="section-title">Lịch chung sắp tới</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <div key={event.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <p className="font-semibold text-ink">{event.title}</p>
              <p className="mt-1 text-xs text-muted">{formatDateVN(event.date)} · {event.type}</p>
            </div>
          ))}
          {!events?.length ? <p className="muted">Chưa có lịch chung sắp tới.</p> : null}
        </div>
      </section>
    </ParentShell>
  );
}
